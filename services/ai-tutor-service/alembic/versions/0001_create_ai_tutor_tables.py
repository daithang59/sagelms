"""Create ai_tutor tables: documents, document_chunks, chat_history, jobs

Revision ID: 0001
Revises: None
Create Date: 2026-03-08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SCHEMA = "ai_tutor"


def upgrade() -> None:
    # Enable pgvector extension (database-level, not schema-scoped)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 1. documents
    op.create_table(
        "documents",
        sa.Column("id", UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("course_id", UUID(), nullable=False),
        sa.Column("lesson_id", UUID(), nullable=False),
        sa.Column(
            "source_type",
            sa.VARCHAR(20),
            nullable=False,
        ),
        sa.Column("source_url", sa.VARCHAR(500)),
        sa.Column("content_hash", sa.VARCHAR(64), nullable=False),
        sa.Column("embedding_model", sa.VARCHAR(50), server_default="text-embedding-ada-002"),
        sa.Column("chunk_count", sa.Integer(), server_default="0"),
        sa.Column("version", sa.Integer(), server_default="1"),
        sa.Column(
            "status",
            sa.VARCHAR(20),
            server_default="PENDING",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.CheckConstraint(
            "source_type IN ('LESSON', 'FILE', 'URL')",
            name="ck_documents_source_type",
        ),
        sa.CheckConstraint(
            "status IN ('PENDING', 'PROCESSING', 'INDEXED', 'FAILED')",
            name="ck_documents_status",
        ),
        sa.UniqueConstraint("lesson_id", "source_type", name="uq_document_source"),
        schema=SCHEMA,
    )

    # 2. document_chunks (requires pgvector)
    op.execute(f"""
        CREATE TABLE {SCHEMA}.document_chunks (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            document_id UUID NOT NULL REFERENCES {SCHEMA}.documents(id) ON DELETE CASCADE,
            course_id   UUID NOT NULL,
            lesson_id   UUID NOT NULL,
            chunk_index INTEGER NOT NULL,
            text        TEXT NOT NULL,
            embedding   VECTOR(1536) NOT NULL,
            metadata    JSONB DEFAULT '{{}}'::jsonb,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    # 3. chat_history
    op.create_table(
        "chat_history",
        sa.Column("id", UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("course_id", UUID(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("citations", JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        schema=SCHEMA,
    )

    # 4. jobs
    op.create_table(
        "jobs",
        sa.Column("id", UUID(), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("idempotency_key", sa.VARCHAR(255), nullable=False, unique=True),
        sa.Column("type", sa.VARCHAR(30), nullable=False),
        sa.Column("status", sa.VARCHAR(20), server_default="QUEUED"),
        sa.Column("payload", JSONB(), nullable=False),
        sa.Column("error", sa.Text()),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.CheckConstraint(
            "type IN ('INGEST_CONTENT', 'GENERATE_QUIZ')",
            name="ck_jobs_type",
        ),
        sa.CheckConstraint(
            "status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED')",
            name="ck_jobs_status",
        ),
        schema=SCHEMA,
    )

    # --- Indexes ---

    # Vector similarity search (IVFFlat) — requires data for effective use
    op.execute(f"""
        CREATE INDEX idx_chunks_embedding ON {SCHEMA}.document_chunks
            USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    """)

    # document_chunks indexes
    op.create_index("idx_chunks_document", "document_chunks", ["document_id"], schema=SCHEMA)
    op.create_index("idx_chunks_course", "document_chunks", ["course_id"], schema=SCHEMA)
    op.create_index("idx_chunks_lesson", "document_chunks", ["lesson_id"], schema=SCHEMA)

    # documents indexes
    op.create_index("idx_documents_course", "documents", ["course_id"], schema=SCHEMA)
    op.create_index("idx_documents_hash", "documents", ["content_hash"], schema=SCHEMA)

    # chat_history index
    op.create_index("idx_chat_user_course", "chat_history", ["user_id", "course_id"], schema=SCHEMA)

    # jobs index
    op.create_index("idx_jobs_status", "jobs", ["status"], schema=SCHEMA)


def downgrade() -> None:
    op.drop_table("jobs", schema=SCHEMA)
    op.drop_table("chat_history", schema=SCHEMA)
    op.execute(f"DROP TABLE IF EXISTS {SCHEMA}.document_chunks")
    op.drop_table("documents", schema=SCHEMA)
    # NOTE: We don't drop the pgvector extension since other schemas might use it
