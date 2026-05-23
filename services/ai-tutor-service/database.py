import os
import re
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel
from sqlalchemy import DateTime, ForeignKey, String, Text, create_engine, event, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

MAX_CONTEXT_MESSAGES = 20
DEFAULT_DB_SCHEMA = "ai_tutor"
SCHEMA_NAME_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def utc_now() -> datetime:
    return datetime.now(UTC)


class DatabaseSettings(BaseModel):
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "sagelms"
    db_user: str = "sagelms"
    db_password: str = "sagelms"
    db_schema: str = DEFAULT_DB_SCHEMA
    database_url: str | None = None

    @classmethod
    def from_env(cls) -> "DatabaseSettings":
        db_schema = os.getenv("DB_SCHEMA", DEFAULT_DB_SCHEMA).strip() or DEFAULT_DB_SCHEMA
        if not SCHEMA_NAME_PATTERN.match(db_schema):
            raise ValueError(f"Invalid DB_SCHEMA value: {db_schema!r}")

        return cls(
            db_host=os.getenv("DB_HOST", "localhost").strip(),
            db_port=int(os.getenv("DB_PORT", "5432")),
            db_name=os.getenv("DB_NAME", "sagelms").strip(),
            db_user=os.getenv("DB_USER", "sagelms").strip(),
            db_password=os.getenv("DB_PASSWORD", "sagelms").strip(),
            db_schema=db_schema,
            database_url=os.getenv("DATABASE_URL"),
        )

    @property
    def sqlalchemy_url(self) -> str:
        if self.database_url:
            return self.database_url
        return f"postgresql+psycopg2://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def is_postgresql(self) -> bool:
        return self.sqlalchemy_url.startswith("postgresql")


database_settings = DatabaseSettings.from_env()
engine = create_engine(database_settings.sqlalchemy_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@event.listens_for(engine, "connect")
def set_postgres_search_path(dbapi_connection, _) -> None:
    if not database_settings.is_postgresql:
        return

    with dbapi_connection.cursor() as cursor:
        cursor.execute(f'SET search_path TO "{database_settings.db_schema}", public')


class Base(DeclarativeBase):
    pass


class AiConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    user_roles: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    course_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    messages: Mapped[list["AiMessageRecord"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AiMessageRecord.created_at",
    )


class AiMessageRecord(Base):
    __tablename__ = "ai_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ai_conversations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)

    conversation: Mapped[AiConversation] = relationship(back_populates="messages")


def init_db() -> None:
    if database_settings.is_postgresql:
        with engine.begin() as connection:
            connection.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{database_settings.db_schema}"'))

    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def build_conversation_title(message: str) -> str:
    compact = " ".join(message.split())
    return compact[:80] if compact else "Cuộc trò chuyện mới"


def get_visible_conversation(db: Session, conversation_id: str, user_id: str) -> AiConversation | None:
    conversation = db.get(AiConversation, conversation_id)
    if (
        conversation is None
        or conversation.deleted_at is not None
        or conversation.user_id != user_id
    ):
        return None
    return conversation


def get_or_create_conversation(
    db: Session,
    conversation_id: str | None,
    user_id: str,
    user_email: str,
    user_roles: str,
    course_id: str | None,
    first_message: str,
) -> AiConversation | None:
    if conversation_id:
        return get_visible_conversation(db, conversation_id, user_id)

    conversation = AiConversation(
        id=str(uuid4()),
        user_id=user_id,
        user_email=user_email,
        user_roles=user_roles,
        course_id=course_id,
        title=build_conversation_title(first_message),
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    db.add(conversation)
    db.flush()
    return conversation


def add_message(
    db: Session,
    conversation: AiConversation,
    role: Literal["user", "assistant"],
    content: str,
    model: str | None = None,
) -> AiMessageRecord:
    message = AiMessageRecord(
        id=str(uuid4()),
        conversation_id=conversation.id,
        role=role,
        content=content,
        model=model,
        created_at=utc_now(),
    )
    conversation.updated_at = message.created_at
    db.add(message)
    db.flush()
    return message


def get_context_messages(db: Session, conversation_id: str) -> list[AiMessageRecord]:
    records = (
        db.execute(
            select(AiMessageRecord)
            .where(AiMessageRecord.conversation_id == conversation_id)
            .order_by(AiMessageRecord.created_at.asc())
        )
        .scalars()
        .all()
    )
    return [
        record
        for record in records[-MAX_CONTEXT_MESSAGES:]
        if record.role in {"user", "assistant"}
    ]


def list_user_conversations(db: Session, user_id: str) -> list[AiConversation]:
    return (
        db.execute(
            select(AiConversation)
            .where(AiConversation.user_id == user_id, AiConversation.deleted_at.is_(None))
            .order_by(AiConversation.updated_at.desc())
        )
        .scalars()
        .all()
    )


def list_conversation_messages(db: Session, conversation_id: str) -> list[AiMessageRecord]:
    return (
        db.execute(
            select(AiMessageRecord)
            .where(AiMessageRecord.conversation_id == conversation_id)
            .order_by(AiMessageRecord.created_at.asc())
        )
        .scalars()
        .all()
    )


def soft_delete_conversation(db: Session, conversation: AiConversation) -> None:
    conversation.deleted_at = utc_now()
    conversation.updated_at = conversation.deleted_at
    db.commit()


def rename_conversation(db: Session, conversation: AiConversation, title: str) -> AiConversation:
    conversation.title = title
    conversation.updated_at = utc_now()
    db.commit()
    db.refresh(conversation)
    return conversation
