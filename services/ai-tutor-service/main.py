import os
from datetime import datetime, timezone
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator


SYSTEM_INSTRUCTION = """
Bạn là SageLMS AI Tutor, một trợ giảng AI thân thiện cho nền tảng học trực tuyến SageLMS.
Hãy trả lời bằng tiếng Việt nếu người học dùng tiếng Việt.
Ưu tiên giải thích ngắn gọn, có cấu trúc, dễ hiểu và phù hợp mục tiêu học tập.
Nếu chưa có nội dung khóa học/RAG đi kèm, hãy nói rõ bạn đang trả lời theo kiến thức chung và tránh bịa citation.
""".strip()


class Settings(BaseModel):
    google_api_key: str = ""
    google_model: str = "gemini-3.0-flash"
    temperature: float = 0.2
    max_output_tokens: int = 1024
    gateway_shared_secret: str = "sagelms-dev-gateway-secret"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            google_api_key=os.getenv("GOOGLE_API_KEY", "").strip(),
            google_model=os.getenv("GOOGLE_MODEL", "gemini-3.0-flash").strip() or "gemini-3.0-flash",
            temperature=float(os.getenv("AI_TUTOR_TEMPERATURE", "0.2")),
            max_output_tokens=int(os.getenv("AI_TUTOR_MAX_OUTPUT_TOKENS", "1024")),
            gateway_shared_secret=os.getenv("GATEWAY_SHARED_SECRET", "sagelms-dev-gateway-secret").strip(),
        )


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ChatMessage(ApiModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        content = value.strip()
        if not content:
            raise ValueError("content must not be blank")
        return content


class ChatRequest(ApiModel):
    message: str = Field(min_length=1, max_length=4000)
    course_id: str | None = Field(default=None, alias="courseId")
    conversation_id: str | None = Field(default=None, alias="conversationId")
    history: list[ChatMessage] = Field(default_factory=list)

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        message = value.strip()
        if not message:
            raise ValueError("message must not be blank")
        return message

    @field_validator("history")
    @classmethod
    def history_must_be_short(cls, value: list[ChatMessage]) -> list[ChatMessage]:
        if len(value) > 20:
            raise ValueError("history must contain at most 20 messages")
        return value


class ChatResponse(ApiModel):
    conversation_id: str = Field(alias="conversationId")
    answer: str
    model_name: str = Field(alias="model")
    course_id: str | None = Field(default=None, alias="courseId")
    created_at: datetime = Field(alias="createdAt")


app = FastAPI(title="SageLMS AI Tutor", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.get("/ping")
def ping() -> str:
    return "ok"


def require_gateway(
    x_from_gateway: str = Header(default="", alias="X-From-Gateway"),
    x_gateway_secret: str = Header(default="", alias="X-Gateway-Secret"),
) -> None:
    settings = Settings.from_env()
    if x_from_gateway.lower() != "true" or x_gateway_secret != settings.gateway_shared_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "GATEWAY_REQUIRED", "message": "AI Tutor API must be called through SageLMS Gateway."},
        )


GatewayDependency = Annotated[None, Depends(require_gateway)]


def build_langchain_messages(
    payload: ChatRequest,
    system_message_cls: type,
    human_message_cls: type,
    ai_message_cls: type,
) -> list[object]:
    system_content = SYSTEM_INSTRUCTION
    if payload.course_id:
        system_content = f"{system_content}\n\ncourseId hiện tại: {payload.course_id}"

    messages: list[object] = [system_message_cls(content=system_content)]
    for message in payload.history:
        message_cls = human_message_cls if message.role == "user" else ai_message_cls
        messages.append(message_cls(content=message.content))
    messages.append(human_message_cls(content=payload.message))
    return messages


def extract_response_text(response: object) -> str:
    content = getattr(response, "content", "")
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(parts).strip()
    return str(content).strip()


def generate_gemini_answer(payload: ChatRequest, settings: Settings) -> str:
    if not settings.google_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "GEMINI_API_KEY_MISSING", "message": "GOOGLE_API_KEY is not configured."},
        )

    try:
        from langchain.schema import AIMessage, HumanMessage, SystemMessage
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "LANGCHAIN_GEMINI_MISSING", "message": "langchain-google-genai is not installed."},
        ) from exc

    llm = ChatGoogleGenerativeAI(
        model=settings.google_model,
        google_api_key=settings.google_api_key,
        temperature=settings.temperature,
        max_output_tokens=settings.max_output_tokens,
    )
    messages = build_langchain_messages(payload, SystemMessage, HumanMessage, AIMessage)
    try:
        response = llm.invoke(messages)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "GEMINI_REQUEST_FAILED", "message": str(exc)},
        ) from exc

    answer = extract_response_text(response)
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "GEMINI_EMPTY_RESPONSE", "message": "Gemini returned an empty response."},
        )
    return answer


@app.post("/api/v1/ai/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, _: GatewayDependency) -> ChatResponse:
    settings = Settings.from_env()
    answer = generate_gemini_answer(payload, settings)
    return ChatResponse(
        conversation_id=payload.conversation_id or str(uuid4()),
        answer=answer,
        model_name=settings.google_model,
        course_id=payload.course_id,
        created_at=datetime.now(timezone.utc),
    )
