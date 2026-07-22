import { afterEach, describe, expect, it, vi } from "vitest"
import { cn, exportarCsv, formatarDataLocal } from "@/lib/utils"

describe("cn", () => {
  it("combina classes condicionais", () => {
    const oculto: boolean = false
    expect(cn("p-4", oculto && "hidden", "text-sm")).toBe("p-4 text-sm")
  })

  it("resolve conflitos de utilitários Tailwind (o último vence)", () => {
    expect(cn("p-4", "p-6")).toBe("p-6")
  })
})

describe("formatarDataLocal", () => {
  it("converte YYYY-MM-DD para DD/MM/AAAA", () => {
    expect(formatarDataLocal("2026-08-15")).toBe("15/08/2026")
  })

  it("não sofre deslocamento de fuso horário", () => {
    // new Date('2026-01-01') seria 31/12/2025 no fuso do Brasil; a função evita isso.
    expect(formatarDataLocal("2026-01-01")).toBe("01/01/2026")
  })
})

describe("exportarCsv", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** Captura o Blob gerado pelo download, sem realmente baixar nada.
   *  O jsdom não implementa URL.createObjectURL/revokeObjectURL, então os
   *  atribuímos diretamente (spyOn exigiria que já existissem). */
  function capturarBlob(cabecalhos: string[], linhas: (string | number)[][]): Blob {
    let blobCapturado: Blob | null = null
    ;(URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (blob: Blob) => {
      blobCapturado = blob
      return "blob:mock"
    }
    ;(URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => {}
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    exportarCsv("teste.csv", cabecalhos, linhas)

    expect(blobCapturado).not.toBeNull()
    return blobCapturado as unknown as Blob
  }

  /** Texto decodificado do CSV. Obs.: Blob.text() decodifica UTF-8 e remove o BOM. */
  async function capturarCsv(cabecalhos: string[], linhas: (string | number)[][]): Promise<string> {
    return await capturarBlob(cabecalhos, linhas).text()
  }

  it("usa ';' como separador (compatível com Excel pt-BR)", async () => {
    const csv = await capturarCsv(["Nome", "Valor"], [["Item", "8500,00"]])
    expect(csv).toContain("Nome;Valor")
    expect(csv).toContain("Item;8500,00")
  })

  it("inicia com BOM UTF-8 para acentuação correta no Excel", async () => {
    const blob = capturarBlob(["Descrição"], [["Perícia"]])
    const bytes = new Uint8Array(await blob.arrayBuffer())
    // BOM UTF-8 = EF BB BF nos três primeiros bytes do arquivo.
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf])
  })

  it("escapa valores que contêm o separador, aspas ou quebra de linha", async () => {
    const csv = await capturarCsv(["Campo"], [['tem;ponto e virgula'], ['tem "aspas"']])
    expect(csv).toContain('"tem;ponto e virgula"')
    expect(csv).toContain('"tem ""aspas"""')
  })

  it("separa as linhas com CRLF", async () => {
    const csv = await capturarCsv(["A"], [["1"], ["2"]])
    expect(csv).toContain("\r\n")
  })
})
