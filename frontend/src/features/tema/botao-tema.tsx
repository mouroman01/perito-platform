import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

type Tema = "claro" | "escuro"

const CHAVE_TEMA = "perito-os:tema"

function temaAtual(): Tema {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "escuro" : "claro"
}

function aplicarTema(tema: Tema) {
  if (tema === "escuro") {
    document.documentElement.setAttribute("data-theme", "dark")
  } else {
    document.documentElement.removeAttribute("data-theme")
  }
}

export function BotaoTema() {
  // Inicia a partir do que o script anti-flash do index.html já aplicou.
  const [tema, setTema] = useState<Tema>(temaAtual)

  useEffect(() => {
    aplicarTema(tema)
    try {
      localStorage.setItem(CHAVE_TEMA, tema)
    } catch {
      // localStorage indisponível (ex.: modo privado) — o tema ainda funciona na sessão.
    }
  }, [tema])

  const escuro = tema === "escuro"

  return (
    <button
      type="button"
      onClick={() => setTema(escuro ? "claro" : "escuro")}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
