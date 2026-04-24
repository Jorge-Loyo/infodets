import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Boolean, Integer, Enum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class RoleEnum(str, enum.Enum):
    admin = "admin"
    operator = "operator"
    viewer = "viewer"


class DocumentStatusEnum(str, enum.Enum):
    pending_approval = "pending_approval"
    indexed = "indexed"
    archived = "archived"


class FeedbackStatusEnum(str, enum.Enum):
    open = "open"
    resolved = "resolved"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cognito_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    role: Mapped[RoleEnum] = mapped_column(Enum(RoleEnum), default=RoleEnum.operator)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    documents: Mapped[list["Document"]] = relationship(back_populates="uploader")
    chat_history: Mapped[list["ChatHistory"]] = relationship(back_populates="user")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String, nullable=False)
    source_url: Mapped[str] = mapped_column(String, nullable=False)
    hierarchy: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[DocumentStatusEnum] = mapped_column(Enum(DocumentStatusEnum), default=DocumentStatusEnum.pending_approval)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    uploader: Mapped["User"] = relationship(back_populates="documents")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    query: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    is_fallback: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="chat_history")
    feedback: Mapped[list["FeedbackReport"]] = relationship(back_populates="chat")


class FeedbackReport(Base):
    __tablename__ = "feedback_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("chat_history.id"))
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[FeedbackStatusEnum] = mapped_column(Enum(FeedbackStatusEnum), default=FeedbackStatusEnum.open)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    chat: Mapped["ChatHistory"] = relationship(back_populates="feedback")
