import os
from typing import Protocol

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel

SYSTEM_INSTRUCTION = """
Bạn là SageLMS AI Tutor, một trợ giảng AI thân thiện cho nền tảng học trực tuyến SageLMS.
Hãy trả lời bằng tiếng Việt nếu người học dùng tiếng Việt.
Ưu tiên giải thích ngắn gọn, có cấu trúc, dễ hiểu và phù hợp mục tiêu học tập.
Nếu chưa có nội dung khóa học/RAG đi kèm, hãy nói rõ bạn đang trả lời theo kiến thức chung và tránh bịa citation.
Không dùng thông tin người dùng để tự cấp quyền truy cập; quyền luôn do Gateway và các service nghiệp vụ kiểm soát.
""".strip()


class GeminiSettings(BaseModel):
    google_api_key: str = ""
    google_model: str = "gemini-2.5-flash"
    temperature: float = 0.2
    max_output_tokens: int = 1024

    @classmethod
    def from_env(cls) -> "GeminiSettings":
        return cls(
            google_api_key=os.getenv("GOOGLE_API_KEY", "").strip(),
            google_model=os.getenv("GOOGLE_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash",
            temperature=float(os.getenv("AI_TUTOR_TEMPERATURE", "0.2")),
            max_output_tokens=int(os.getenv("AI_TUTOR_MAX_OUTPUT_TOKENS", "1024")),
        )


class ChatPayload(Protocol):
    message: str
    course_id: str | None


class UserContextLike(Protocol):
    email: str
    roles: str


class HistoryMessageLike(Protocol):
    role: str
    content: str


class GeminiConfigurationError(Exception):
    pass


class GeminiRequestError(Exception):
    pass


class GeminiEmptyResponseError(Exception):
    pass


def build_langchain_messages(
    payload: ChatPayload,
    user: UserContextLike,
    history: list[HistoryMessageLike],
) -> list[object]:
    user_context = [
        f"Email người dùng: {user.email or 'Không rõ'}",
        f"Vai trò người dùng: {user.roles or 'Không rõ'}",
    ]
    if payload.course_id:
        user_context.append(f"courseId hiện tại: {payload.course_id}")

    system_content = f"{SYSTEM_INSTRUCTION}\n\nThông tin ngữ cảnh:\n" + "\n".join(user_context)

    messages: list[object] = [SystemMessage(content=system_content)]
    for message in history:
        message_cls = HumanMessage if message.role == "user" else AIMessage
        messages.append(message_cls(content=message.content))
    messages.append(HumanMessage(content=payload.message))
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


def generate_gemini_answer(
    payload: ChatPayload,
    user: UserContextLike,
    history: list[HistoryMessageLike],
    settings: GeminiSettings,
) -> str:
    if not settings.google_api_key:
        raise GeminiConfigurationError("GOOGLE_API_KEY is not configured.")

    llm = ChatGoogleGenerativeAI(
        model=settings.google_model,
        google_api_key=settings.google_api_key,
        temperature=settings.temperature,
        max_output_tokens=settings.max_output_tokens,
    )
    messages = build_langchain_messages(payload, user, history)
    try:
        response = llm.invoke(messages)
    except Exception as exc:
        raise GeminiRequestError(str(exc)) from exc

    answer = extract_response_text(response)
    if not answer:
        raise GeminiEmptyResponseError("Gemini returned an empty response.")
    return answer
