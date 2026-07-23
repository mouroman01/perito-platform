"""Integração com a API da Anthropic (Claude) para os recursos de IA (RF015).

Primeiros recursos: resumo de documentos/laudos e sugestão de estrutura de laudo.
A chave da API vem de `settings.ANTHROPIC_API_KEY` (definida em backend/.env, não
versionada). Sem a chave configurada, os endpoints respondem 503 com mensagem clara.
"""
import anthropic
from fastapi import HTTPException, status

from app.core.config import settings

_cliente: anthropic.Anthropic | None = None

# Limites de saída conservadores (resumo é curto; estrutura é um esqueleto de laudo).
_MAX_TOKENS_RESUMO = 1500
_MAX_TOKENS_ESTRUTURA = 3000

_SYSTEM_RESUMO = (
    "Você é um assistente de um perito judicial no Brasil. Resuma o texto fornecido "
    "em português do Brasil de forma objetiva e fiel, preservando termos técnicos e "
    "jurídicos, valores, datas e nomes das partes. Não invente informações que não "
    "estejam no texto. Responda apenas com o resumo, sem preâmbulos."
)

_SYSTEM_ESTRUTURA = (
    "Você é um assistente de um perito judicial no Brasil. A partir do contexto do "
    "processo, proponha uma estrutura (esqueleto) de laudo pericial em português do "
    "Brasil, com seções e tópicos numerados (ex.: 1. Introdução, 2. Metodologia, "
    "3. Quesitos, 4. Análise, 5. Conclusão), adequada à especialidade e ao objeto do "
    "processo. Use marcadores de preenchimento entre colchetes onde couber. Responda "
    "apenas com a estrutura, sem preâmbulos."
)


def _obter_cliente() -> anthropic.Anthropic:
    global _cliente
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="IA não configurada: defina ANTHROPIC_API_KEY em backend/.env.",
        )
    if _cliente is None:
        _cliente = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _cliente


def _texto_da_resposta(resposta) -> str:
    partes = [bloco.text for bloco in resposta.content if bloco.type == "text"]
    return "\n".join(partes).strip()


def _chamar(system: str, conteudo_usuario: str, max_tokens: int, pensar: bool) -> str:
    cliente = _obter_cliente()
    parametros = {
        "model": settings.ANTHROPIC_MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": conteudo_usuario}],
    }
    if pensar:
        # Pensamento adaptativo: o modelo decide quando/quanto raciocinar.
        parametros["thinking"] = {"type": "adaptive"}
    try:
        resposta = cliente.messages.create(**parametros)
    except anthropic.AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chave da API de IA inválida. Verifique ANTHROPIC_API_KEY.",
        )
    except anthropic.APIError as erro:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Falha ao consultar o serviço de IA: {erro.__class__.__name__}",
        )
    return _texto_da_resposta(resposta)


def resumir(texto: str) -> str:
    return _chamar(_SYSTEM_RESUMO, texto, _MAX_TOKENS_RESUMO, pensar=False)


def sugerir_estrutura_laudo(contexto: str) -> str:
    return _chamar(_SYSTEM_ESTRUTURA, contexto, _MAX_TOKENS_ESTRUTURA, pensar=True)
