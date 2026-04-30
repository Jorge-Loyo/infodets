import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Boolean, Integer, Enum, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class RolEnum(str, enum.Enum):
    admin = "admin"
    operador = "operador"
    visor = "visor"


class EstadoDocumentoEnum(str, enum.Enum):
    pendiente_aprobacion = "pendiente_aprobacion"
    indexado = "indexado"
    archivado = "archivado"


class EstadoFeedbackEnum(str, enum.Enum):
    abierto = "abierto"
    resuelto = "resuelto"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cognito_sub: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    nombre: Mapped[str | None] = mapped_column(String, nullable=True)
    apellido: Mapped[str | None] = mapped_column(String, nullable=True)
    dni: Mapped[str | None] = mapped_column(String, nullable=True)
    fecha_nacimiento: Mapped[str | None] = mapped_column(String, nullable=True)
    cargo: Mapped[str | None] = mapped_column(String, nullable=True)
    institucion: Mapped[str | None] = mapped_column(String, nullable=True)
    dependencia: Mapped[str | None] = mapped_column(String, nullable=True)
    rol: Mapped[RolEnum] = mapped_column(Enum(RolEnum), default=RolEnum.operador)
    perfil_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("perfiles.id"), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    documentos: Mapped[list["Documento"]] = relationship(back_populates="subidor")
    historial_chat: Mapped[list["HistorialChat"]] = relationship(back_populates="usuario")
    permisos: Mapped[list["PermisoUsuario"]] = relationship(back_populates="usuario")
    perfil: Mapped["Perfil | None"] = relationship(back_populates="usuarios")


class Documento(Base):
    __tablename__ = "documentos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo: Mapped[str] = mapped_column(String, nullable=False)
    url_fuente: Mapped[str] = mapped_column(String, nullable=False)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    dependencia: Mapped[str | None] = mapped_column(String, nullable=True)
    jerarquia: Mapped[int] = mapped_column(Integer, default=1)
    estado: Mapped[EstadoDocumentoEnum] = mapped_column(Enum(EstadoDocumentoEnum), default=EstadoDocumentoEnum.pendiente_aprobacion)
    subido_por: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    subidor: Mapped["Usuario | None"] = relationship(back_populates="documentos")


class HistorialChat(Base):
    __tablename__ = "historial_chat"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    documento_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=True)
    pregunta: Mapped[str] = mapped_column(Text, nullable=False)
    respuesta: Mapped[str] = mapped_column(Text, nullable=False)
    puntaje_confianza: Mapped[float] = mapped_column(Float, default=0.0)
    es_fallback: Mapped[bool] = mapped_column(Boolean, default=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship(back_populates="historial_chat")
    documento: Mapped["Documento | None"] = relationship()
    feedback: Mapped[list["ReporteFeedback"]] = relationship(back_populates="historial")


class TicketVacio(Base):
    __tablename__ = "tickets_vacios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pregunta: Mapped[str] = mapped_column(Text, nullable=False)
    usuario_id: Mapped[str | None] = mapped_column(String, nullable=True)
    puntaje_confianza: Mapped[float] = mapped_column(Float, default=0.0)
    estado: Mapped[str] = mapped_column(String, default="pendiente")  # pendiente | revisado
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Noticia(Base):
    __tablename__ = "noticias"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo: Mapped[str] = mapped_column(String, nullable=False)
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    imagen_url: Mapped[str | None] = mapped_column(String, nullable=True)
    autor_nombre: Mapped[str | None] = mapped_column(String, nullable=True)
    autor_cargo: Mapped[str | None] = mapped_column(String, nullable=True)
    publicada: Mapped[bool] = mapped_column(Boolean, default=False)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TablaValor(Base):
    __tablename__ = "tabla_valores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tabla_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    valor: Mapped[str] = mapped_column(String, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Perfil(Base):
    __tablename__ = "perfiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String, nullable=True)
    color: Mapped[str] = mapped_column(String, default="blue")
    rol: Mapped[str | None] = mapped_column(String, nullable=True)  # rol que representa este perfil
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    permisos: Mapped[list["PerfilPermiso"]] = relationship(back_populates="perfil", cascade="all, delete-orphan")
    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="perfil")


class PerfilPermiso(Base):
    __tablename__ = "perfil_permisos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    perfil_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("perfiles.id"), nullable=False)
    seccion: Mapped[str] = mapped_column(String, nullable=False)
    habilitado: Mapped[bool] = mapped_column(Boolean, default=True)

    perfil: Mapped["Perfil"] = relationship(back_populates="permisos")


class PermisoUsuario(Base):
    __tablename__ = "permisos_usuario"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    seccion: Mapped[str] = mapped_column(String, nullable=False)
    habilitado: Mapped[bool] = mapped_column(Boolean, default=True)
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship(back_populates="permisos")


class ValidacionRespuesta(Base):
    __tablename__ = "validaciones_respuesta"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pregunta: Mapped[str] = mapped_column(Text, nullable=False)
    respuesta: Mapped[str] = mapped_column(Text, nullable=False)
    puntaje_confianza: Mapped[float] = mapped_column(Float, default=0.0)
    fuente: Mapped[str] = mapped_column(String, default="usuario")  # usuario | invitado
    estado: Mapped[str] = mapped_column(String, default="pendiente")  # pendiente | aprobado | rechazado | auto_indexado
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ConsultaInvitado(Base):
    __tablename__ = "consultas_invitado"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String, nullable=False)
    apellido: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    institucion: Mapped[str | None] = mapped_column(String, nullable=True)
    pregunta: Mapped[str] = mapped_column(Text, nullable=False)
    respuesta: Mapped[str] = mapped_column(Text, nullable=False)
    puntaje_confianza: Mapped[float] = mapped_column(Float, default=0.0)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ReporteFeedback(Base):
    __tablename__ = "reportes_feedback"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    historial_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("historial_chat.id"))
    es_correcto: Mapped[bool] = mapped_column(Boolean, nullable=False)
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[EstadoFeedbackEnum] = mapped_column(Enum(EstadoFeedbackEnum), default=EstadoFeedbackEnum.abierto)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    historial: Mapped["HistorialChat"] = relationship(back_populates="feedback")
