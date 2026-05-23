import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy.orm import Session

import chatbot
import database
import learning_context


class ApiModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ChatRequest(ApiModel):
    message: str = Field(min_length=1, max_length=4000)
    course_id: str | None = Field(default=None, alias="courseId")
    challenge_id: str | None = Field(default=None, alias="challengeId")
    conversation_id: str | None = Field(default=None, alias="conversationId")

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        message = value.strip()
        if not message:
            raise ValueError("message must not be blank")
        return message

    @model_validator(mode="after")
    def only_one_learning_context(self) -> "ChatRequest":
        if self.course_id and self.challenge_id:
            raise ValueError("courseId and challengeId cannot be used together")
        return self


class ChatResponse(ApiModel):
    conversation_id: str = Field(alias="conversationId")
    answer: str
    model_name: str = Field(alias="model")
    course_id: str | None = Field(default=None, alias="courseId")
    created_at: datetime = Field(alias="createdAt")


class ConversationSummary(ApiModel):
    id: str
    title: str
    course_id: str | None = Field(default=None, alias="courseId")
    updated_at: datetime = Field(alias="updatedAt")
    created_at: datetime = Field(alias="createdAt")


class StoredMessage(ApiModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(alias="createdAt")


class RenameConversationRequest(ApiModel):
    title: str = Field(min_length=1, max_length=160)

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        title = " ".join(value.split())
        if not title:
            raise ValueError("title must not be blank")
        return title


class UserContext(ApiModel):
    user_id: str
    email: str = ""
    roles: str = ""


@asynccontextmanager
async def lifespan(_: FastAPI):
    database.init_db()
    yield


app = FastAPI(title="SageLMS AI Tutor", version="0.2.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.get("/ping")
def ping() -> str:
    return "ok"


def get_user_context(
    x_user_id: str = Header(default="", alias="X-User-Id"),
    x_user_email: str = Header(default="", alias="X-User-Email"),
    x_user_roles: str = Header(default="", alias="X-User-Roles"),
) -> UserContext:
    user_id = x_user_id.strip()
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_CONTEXT_MISSING", "message": "Gateway did not provide user context."},
        )
    return UserContext(user_id=user_id, email=x_user_email.strip(), roles=x_user_roles.strip())


def require_gateway(
    x_from_gateway: str = Header(default="", alias="X-From-Gateway"),
    x_gateway_secret: str = Header(default="", alias="X-Gateway-Secret"),
) -> None:
    gateway_secret = os.getenv("GATEWAY_SHARED_SECRET", "sagelms-dev-gateway-secret").strip()
    if x_from_gateway.lower() != "true" or x_gateway_secret != gateway_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "GATEWAY_REQUIRED", "message": "AI Tutor API must be called through SageLMS Gateway."},
        )


GatewayDependency = Annotated[None, Depends(require_gateway)]
UserDependency = Annotated[UserContext, Depends(get_user_context)]
DbDependency = Annotated[Session, Depends(database.get_db)]


def require_visible_conversation(db: Session, conversation_id: str, user: UserContext) -> database.AiConversation:
    conversation = database.get_visible_conversation(db, conversation_id, user.user_id)
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONVERSATION_NOT_FOUND", "message": "Conversation not found."},
        )
    return conversation


def map_gemini_error(error: Exception) -> HTTPException:
    if isinstance(error, chatbot.GeminiConfigurationError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "GEMINI_API_KEY_MISSING", "message": str(error)},
        )
    if isinstance(error, chatbot.GeminiEmptyResponseError):
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "GEMINI_EMPTY_RESPONSE", "message": str(error)},
        )
    if isinstance(error, chatbot.GeminiRequestError):
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "GEMINI_REQUEST_FAILED", "message": str(error)},
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={"code": "AI_TUTOR_ERROR", "message": str(error)},
    )


def map_learning_context_error(error: learning_context.LearningContextError) -> HTTPException:
    if isinstance(error, learning_context.LearningContextForbiddenError):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "LEARNING_CONTEXT_FORBIDDEN", "message": str(error)},
        )
    if isinstance(error, learning_context.LearningContextNotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "LEARNING_CONTEXT_NOT_FOUND", "message": str(error)},
        )
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail={"code": "LEARNING_CONTEXT_REQUEST_FAILED", "message": str(error)},
    )


@app.post("/api/v1/ai/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, _: GatewayDependency, user: UserDependency, db: DbDependency) -> ChatResponse:
    gemini_settings = chatbot.GeminiSettings.from_env()
    conversation = database.get_or_create_conversation(
        db=db,
        conversation_id=payload.conversation_id,
        user_id=user.user_id,
        user_email=user.email,
        user_roles=user.roles,
        course_id=payload.course_id,
        first_message=payload.message,
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONVERSATION_NOT_FOUND", "message": "Conversation not found."},
        )

    try:
        learning_context_text = learning_context.load_learning_context(payload, user)
    except learning_context.LearningContextError as exc:
        db.rollback()
        raise map_learning_context_error(exc) from exc

    history = database.get_context_messages(db, conversation.id)
    database.add_message(db, conversation, "user", payload.message)

    try:
        answer = chatbot.generate_gemini_answer(payload, user, history, gemini_settings, learning_context_text)
        assistant_message = database.add_message(db, conversation, "assistant", answer, gemini_settings.google_model)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise map_gemini_error(exc) from exc

    return ChatResponse(
        conversation_id=conversation.id,
        answer=answer,
        model_name=gemini_settings.google_model,
        course_id=conversation.course_id,
        created_at=assistant_message.created_at,
    )


@app.get("/api/v1/ai/conversations", response_model=list[ConversationSummary])
def list_conversations(_: GatewayDependency, user: UserDependency, db: DbDependency) -> list[ConversationSummary]:
    conversations = database.list_user_conversations(db, user.user_id)
    return [
        ConversationSummary(
            id=conversation.id,
            title=conversation.title,
            course_id=conversation.course_id,
            updated_at=conversation.updated_at,
            created_at=conversation.created_at,
        )
        for conversation in conversations
    ]


@app.get("/api/v1/ai/conversations/{conversation_id}/messages", response_model=list[StoredMessage])
def get_conversation_messages(
    conversation_id: str,
    _: GatewayDependency,
    user: UserDependency,
    db: DbDependency,
) -> list[StoredMessage]:
    require_visible_conversation(db, conversation_id, user)
    messages = database.list_conversation_messages(db, conversation_id)
    return [
        StoredMessage(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
        )
        for message in messages
        if message.role in {"user", "assistant"}
    ]


@app.put("/api/v1/ai/conversations/{conversation_id}", response_model=ConversationSummary)
def rename_conversation(
    conversation_id: str,
    payload: RenameConversationRequest,
    _: GatewayDependency,
    user: UserDependency,
    db: DbDependency,
) -> ConversationSummary:
    conversation = require_visible_conversation(db, conversation_id, user)
    updated = database.rename_conversation(db, conversation, payload.title)
    return ConversationSummary(
        id=updated.id,
        title=updated.title,
        course_id=updated.course_id,
        updated_at=updated.updated_at,
        created_at=updated.created_at,
    )


@app.delete("/api/v1/ai/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, _: GatewayDependency, user: UserDependency, db: DbDependency) -> None:
    conversation = require_visible_conversation(db, conversation_id, user)
    database.soft_delete_conversation(db, conversation)
