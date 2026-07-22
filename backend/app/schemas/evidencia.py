from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.evidencia import MidiaOrigemEvidencia, TipoEvidencia
from app.schemas.prospeccao import UsuarioResumo


class EvidenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome_original: str
    tipo: TipoEvidencia
    midia_origem: MidiaOrigemEvidencia | None
    descricao: str | None
    hash_sha256: str
    tamanho_bytes: int
    content_type: str | None
    processo_id: int
    responsavel: UsuarioResumo | None
    criado_em: datetime
