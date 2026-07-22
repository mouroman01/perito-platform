import { describe, expect, it } from "vitest"
import { LABEL_TIPO_BUSCA, type TipoResultadoBusca } from "@/features/busca/types"

describe("LABEL_TIPO_BUSCA", () => {
  it("tem rótulo para cada um dos 8 tipos de resultado de busca", () => {
    const tipos: TipoResultadoBusca[] = [
      "processo",
      "cliente",
      "advogado",
      "escritorio",
      "contato",
      "magistrado",
      "comarca",
      "laudo",
    ]
    for (const tipo of tipos) {
      expect(LABEL_TIPO_BUSCA[tipo]).toBeTruthy()
    }
    expect(Object.keys(LABEL_TIPO_BUSCA)).toHaveLength(8)
  })
})
