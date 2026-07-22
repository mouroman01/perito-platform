import { describe, expect, it } from "vitest"
import {
  formatarCompetencia,
  LABEL_TIPO_IMPOSTO,
  TIPOS_IMPOSTO,
  type TipoImposto,
} from "@/features/financeiro/types"

describe("formatarCompetencia", () => {
  it("converte a data ISO da competência para mês/ano", () => {
    expect(formatarCompetencia("2026-07-01")).toBe("07/2026")
  })
})

describe("LABEL_TIPO_IMPOSTO", () => {
  it("tem rótulo para todos os tipos de imposto", () => {
    const tipos: TipoImposto[] = ["darf_inss", "darf_irpf", "iss", "outro"]
    for (const tipo of tipos) {
      expect(LABEL_TIPO_IMPOSTO[tipo]).toBeTruthy()
    }
  })

  it("está consistente com a lista TIPOS_IMPOSTO exibida no formulário", () => {
    for (const { valor, label } of TIPOS_IMPOSTO) {
      expect(LABEL_TIPO_IMPOSTO[valor]).toBe(label)
    }
  })
})
