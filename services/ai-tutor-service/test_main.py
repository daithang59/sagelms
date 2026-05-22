import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import chatbot
import database
import learning_context
import main


@pytest.fixture()
def db_session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    database.Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        database.Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    def override_get_db():
        yield db_session

    main.app.dependency_overrides[database.get_db] = override_get_db
    try:
        yield TestClient(main.app)
    finally:
        main.app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def no_external_learning_context(monkeypatch) -> None:
    monkeypatch.setattr(learning_context, "load_learning_context", lambda payload, user: None)


def gateway_headers(
    secret: str = "sagelms-dev-gateway-secret",
    user_id: str = "user-1",
    email: str = "student@sagelms.dev",
    roles: str = "STUDENT",
) -> dict[str, str]:
    return {
        "X-From-Gateway": "true",
        "X-Gateway-Secret": secret,
        "X-User-Id": user_id,
        "X-User-Email": email,
        "X-User-Roles": roles,
    }


def test_health_is_up(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "UP"}


def test_chat_requires_gateway_headers(client: TestClient) -> None:
    response = client.post("/api/v1/ai/chat", json={"message": "Xin chao"})

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "GATEWAY_REQUIRED"


def test_chat_requires_user_context(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ai/chat",
        headers={"X-From-Gateway": "true", "X-Gateway-Secret": "sagelms-dev-gateway-secret"},
        json={"message": "Xin chao"},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "USER_CONTEXT_MISSING"


def test_chat_rejects_blank_message(client: TestClient) -> None:
    response = client.post("/api/v1/ai/chat", headers=gateway_headers(), json={"message": "   "})

    assert response.status_code == 422


def test_chat_rejects_course_and_challenge_together(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ai/chat",
        headers=gateway_headers(),
        json={"message": "Hoc gi?", "courseId": "course-1", "challengeId": "challenge-1"},
    )

    assert response.status_code == 422


def test_chat_requires_google_api_key(client: TestClient, monkeypatch) -> None:
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    response = client.post("/api/v1/ai/chat", headers=gateway_headers(), json={"message": "Giai thich React state"})

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "GEMINI_API_KEY_MISSING"


def test_chat_creates_conversation_and_stores_messages(client: TestClient, db_session: Session, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setenv("GOOGLE_MODEL", "gemini-test")

    def fake_generate_gemini_answer(
        payload: main.ChatRequest,
        user: main.UserContext,
        history: list[database.AiMessageRecord],
        settings: chatbot.GeminiSettings,
        learning_context_text: str | None = None,
    ) -> str:
        assert payload.message == "React state la gi?"
        assert user.email == "student@sagelms.dev"
        assert history == []
        assert settings.google_model == "gemini-test"
        assert learning_context_text is None
        return "State la du lieu thay doi theo thoi gian trong component."

    monkeypatch.setattr(chatbot, "generate_gemini_answer", fake_generate_gemini_answer)

    response = client.post(
        "/api/v1/ai/chat",
        headers=gateway_headers(),
        json={"message": "React state la gi?", "courseId": "course-1"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "State la du lieu thay doi theo thoi gian trong component."
    assert body["model"] == "gemini-test"
    assert body["courseId"] == "course-1"

    conversation = db_session.get(database.AiConversation, body["conversationId"])
    assert conversation is not None
    assert conversation.user_id == "user-1"
    assert conversation.user_email == "student@sagelms.dev"

    messages = db_session.execute(select(database.AiMessageRecord).order_by(database.AiMessageRecord.created_at)).scalars().all()
    assert [message.role for message in messages] == ["user", "assistant"]


def test_chat_passes_learning_context_to_gemini(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setattr(learning_context, "load_learning_context", lambda payload, user: "Course: React Basics")

    def fake_generate_gemini_answer(
        payload: main.ChatRequest,
        user: main.UserContext,
        history: list[database.AiMessageRecord],
        settings: chatbot.GeminiSettings,
        learning_context_text: str | None = None,
    ) -> str:
        assert payload.course_id == "course-1"
        assert learning_context_text == "Course: React Basics"
        return "Theo khoa hoc React Basics..."

    monkeypatch.setattr(chatbot, "generate_gemini_answer", fake_generate_gemini_answer)

    response = client.post(
        "/api/v1/ai/chat",
        headers=gateway_headers(),
        json={"message": "Tom tat khoa hoc", "courseId": "course-1"},
    )

    assert response.status_code == 200
    assert response.json()["answer"] == "Theo khoa hoc React Basics..."


def test_learning_context_forbidden_maps_to_403(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")

    def fake_load_context(payload: main.ChatRequest, user: main.UserContext) -> str:
        raise learning_context.LearningContextForbiddenError("No access")

    monkeypatch.setattr(learning_context, "load_learning_context", fake_load_context)

    response = client.post(
        "/api/v1/ai/chat",
        headers=gateway_headers(),
        json={"message": "Tom tat khoa hoc", "courseId": "course-1"},
    )

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "LEARNING_CONTEXT_FORBIDDEN"


def test_chat_uses_saved_history_for_same_conversation(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    calls: list[list[database.AiMessageRecord]] = []

    def fake_generate_gemini_answer(
        payload: main.ChatRequest,
        user: main.UserContext,
        history: list[database.AiMessageRecord],
        settings: chatbot.GeminiSettings,
        learning_context_text: str | None = None,
    ) -> str:
        calls.append(history)
        return f"Tra loi: {payload.message}"

    monkeypatch.setattr(chatbot, "generate_gemini_answer", fake_generate_gemini_answer)

    first = client.post("/api/v1/ai/chat", headers=gateway_headers(), json={"message": "Cau 1"})
    conversation_id = first.json()["conversationId"]
    second = client.post(
        "/api/v1/ai/chat",
        headers=gateway_headers(),
        json={"message": "Cau 2", "conversationId": conversation_id},
    )

    assert second.status_code == 200
    assert calls[0] == []
    assert [(message.role, message.content) for message in calls[1]] == [
        ("user", "Cau 1"),
        ("assistant", "Tra loi: Cau 1"),
    ]


def test_user_cannot_read_or_delete_other_user_conversation(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setattr(chatbot, "generate_gemini_answer", lambda payload, user, history, settings, learning_context_text=None: "OK")

    created = client.post("/api/v1/ai/chat", headers=gateway_headers(user_id="user-a"), json={"message": "Xin chao"})
    conversation_id = created.json()["conversationId"]

    read_response = client.get(
        f"/api/v1/ai/conversations/{conversation_id}/messages",
        headers=gateway_headers(user_id="user-b"),
    )
    delete_response = client.delete(
        f"/api/v1/ai/conversations/{conversation_id}",
        headers=gateway_headers(user_id="user-b"),
    )

    assert read_response.status_code == 404
    assert delete_response.status_code == 404


def test_list_conversations_excludes_soft_deleted(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setattr(chatbot, "generate_gemini_answer", lambda payload, user, history, settings, learning_context_text=None: "OK")

    first = client.post("/api/v1/ai/chat", headers=gateway_headers(), json={"message": "Cuoc tro chuyen A"})
    second = client.post("/api/v1/ai/chat", headers=gateway_headers(), json={"message": "Cuoc tro chuyen B"})
    client.delete(f"/api/v1/ai/conversations/{first.json()['conversationId']}", headers=gateway_headers())

    response = client.get("/api/v1/ai/conversations", headers=gateway_headers())

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [second.json()["conversationId"]]


def test_user_can_rename_own_conversation(client: TestClient, db_session: Session, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setattr(chatbot, "generate_gemini_answer", lambda payload, user, history, settings, learning_context_text=None: "OK")

    created = client.post("/api/v1/ai/chat", headers=gateway_headers(), json={"message": "Ten cu"})
    conversation_id = created.json()["conversationId"]

    response = client.put(
        f"/api/v1/ai/conversations/{conversation_id}",
        headers=gateway_headers(),
        json={"title": "  Ten hoi thoai moi  "},
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Ten hoi thoai moi"

    conversation = db_session.get(database.AiConversation, conversation_id)
    assert conversation is not None
    assert conversation.title == "Ten hoi thoai moi"


def test_user_cannot_rename_other_user_conversation(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setattr(chatbot, "generate_gemini_answer", lambda payload, user, history, settings, learning_context_text=None: "OK")

    created = client.post("/api/v1/ai/chat", headers=gateway_headers(user_id="user-a"), json={"message": "Xin chao"})
    conversation_id = created.json()["conversationId"]

    response = client.put(
        f"/api/v1/ai/conversations/{conversation_id}",
        headers=gateway_headers(user_id="user-b"),
        json={"title": "Khong duoc doi"},
    )

    assert response.status_code == 404
