"""Limitador de tentativas de login.

Usa Redis quando disponível (necessário para funcionar corretamente com
múltiplas réplicas do backend); cai automaticamente para um contador em
memória do processo se o Redis estiver indisponível, para não derrubar o
login em ambientes de desenvolvimento sem Redis rodando.
"""

import time
from collections import defaultdict
from threading import Lock

import redis

from app.core.config import settings

JANELA_SEGUNDOS = 15 * 60
LIMITE_TENTATIVAS = 5

_redis_client: redis.Redis | None = None
_redis_indisponivel_ate = 0.0
_memoria: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


def _obter_redis() -> redis.Redis | None:
    global _redis_client, _redis_indisponivel_ate
    agora = time.time()
    if agora < _redis_indisponivel_ate:
        return None

    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.REDIS_URL, socket_connect_timeout=0.3, socket_timeout=0.3
            )
            _redis_client.ping()
        except Exception:
            _redis_client = None
            _redis_indisponivel_ate = agora + 30
            return None

    try:
        _redis_client.ping()
        return _redis_client
    except Exception:
        _redis_client = None
        _redis_indisponivel_ate = agora + 30
        return None


def registrar_falha(chave: str) -> None:
    cliente = _obter_redis()
    if cliente is not None:
        pipe = cliente.pipeline()
        pipe.incr(chave)
        pipe.expire(chave, JANELA_SEGUNDOS)
        pipe.execute()
        return

    with _lock:
        agora = time.time()
        tentativas = [t for t in _memoria[chave] if t > agora - JANELA_SEGUNDOS]
        tentativas.append(agora)
        _memoria[chave] = tentativas


def contar_falhas(chave: str) -> int:
    cliente = _obter_redis()
    if cliente is not None:
        valor = cliente.get(chave)
        return int(valor) if valor else 0

    with _lock:
        agora = time.time()
        tentativas = [t for t in _memoria[chave] if t > agora - JANELA_SEGUNDOS]
        _memoria[chave] = tentativas
        return len(tentativas)


def limpar(chave: str) -> None:
    cliente = _obter_redis()
    if cliente is not None:
        cliente.delete(chave)
        return

    with _lock:
        _memoria.pop(chave, None)
