import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata uma data no formato "YYYY-MM-DD" sem sofrer deslocamento de fuso horário. */
export function formatarDataLocal(data: string) {
  const [ano, mes, dia] = data.split("-")
  return `${dia}/${mes}/${ano}`
}

/**
 * Gera e baixa um arquivo CSV (com BOM para acentuação correta no Excel).
 * Usa ";" como separador — o Excel em português (pt-BR) trata "," como separador
 * decimal, então um CSV separado por vírgula com números como "8500,00" não é
 * dividido em colunas corretamente.
 */
export function exportarCsv(nomeArquivo: string, cabecalhos: string[], linhas: (string | number)[][]) {
  const SEPARADOR = ";"
  const escapar = (valor: string | number) => {
    const texto = String(valor ?? "")
    if (texto.includes(SEPARADOR) || texto.includes('"') || texto.includes("\n")) {
      return `"${texto.replace(/"/g, '""')}"`
    }
    return texto
  }
  const conteudo = [cabecalhos, ...linhas].map((linha) => linha.map(escapar).join(SEPARADOR)).join("\r\n")
  const BOM = "﻿"
  const blob = new Blob([BOM + conteudo], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)
}
