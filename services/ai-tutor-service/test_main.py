from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def gateway_headers(secret: str = "sagelms-dev-gateway-secret") -> dict[str, str]:
    return {
        "X-From-Gateway": "true",
        "X-Gateway-Secret": secret,
    }


def test_health_is_up() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "UP"}


def test_chat_requires_gateway_headers() -> None:
    response = client.post("/api/v1/ai/chat", json={"message": "Xin chào"})

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "GATEWAY_REQUIRED"


def test_chat_rejects_blank_message() -> None:
    response = client.post("/api/v1/ai/chat", headers=gateway_headers(), json={"message": "   "})

    assert response.status_code == 422


def test_chat_requires_google_api_key(monkeypatch) -> None:
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    response = client.post("/api/v1/ai/chat", headers=gateway_headers(), json={"message": "Giải thích React state"})

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "GEMINI_API_KEY_MISSING"


def test_chat_returns_gemini_answer(monkeypatch) -> None:
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.setenv("GOOGLE_MODEL", "gemini-test")

    def fake_generate_gemini_answer(payload: main.ChatRequest, settings: main.Settings) -> str:
        assert payload.message == "React state là gì?"
        assert settings.google_model == "gemini-test"
        return "State là dữ liệu thay đổi theo thời gian trong component."

    monkeypatch.setattr(main, "generate_gemini_answer", fake_generate_gemini_answer)

    response = client.post(
        "/api/v1/ai/chat",
        headers=gateway_headers(),
        json={"message": "React state là gì?", "courseId": "course-1", "conversationId": "conversation-1"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["conversationId"] == "conversation-1"
    assert body["answer"] == "State là dữ liệu thay đổi theo thời gian trong component."
    assert body["model"] == "gemini-test"
    assert body["courseId"] == "course-1"
