from pydantic import BaseModel


class HotTopic(BaseModel):
    tema: str
    cantidad: int
    porcentaje: float


class ConsultasPorDia(BaseModel):
    fecha: str
    cantidad: int


class DashboardStats(BaseModel):
    total_consultas: int
    total_feedback_incorrecto: int
    total_documentos: int
    consultas_sin_respuesta: int
    hot_topics: list[HotTopic]
    consultas_por_dia: list[ConsultasPorDia]
