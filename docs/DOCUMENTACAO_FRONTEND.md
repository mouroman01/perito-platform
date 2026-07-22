# Perito OS — Documentação Técnica do Frontend

> Referência completa, arquivo por arquivo e função por função, do frontend do Perito OS.
> Stack: **React 19 + TypeScript + Vite + Tailwind CSS v4 + React Query (TanStack) + React Router + Axios + Recharts**.
>
> Última atualização: 20/07/2026 — cobre todos os módulos, incluindo os mais recentes
> (sub-entidades do CRM, Evidências, Busca global e DARF/Impostos).

---

## Sumário

1. [Visão geral e padrões do projeto](#1-visão-geral-e-padrões-do-projeto)
2. [Ponto de entrada e roteamento](#2-ponto-de-entrada-e-roteamento)
3. [Biblioteca base (`lib/`)](#3-biblioteca-base-lib)
4. [Componentes de UI (`components/ui/`)](#4-componentes-de-ui-componentsui)
5. [Layout da aplicação (`components/layout/`)](#5-layout-da-aplicação-componentslayout)
6. [Autenticação (`features/auth/`)](#6-autenticação-featuresauth)
7. [Dashboard (`features/dashboard/`)](#7-dashboard-featuresdashboard)
8. [Busca global (`features/busca/`)](#8-busca-global-featuresbusca)
9. [CRM (`features/crm/`)](#9-crm-featurescrm)
10. [Processos (`features/processos/`)](#10-processos-featuresprocessos)
11. [Agenda (`features/agenda/`)](#11-agenda-featuresagenda)
12. [Financeiro (`features/financeiro/`)](#12-financeiro-featuresfinanceiro)
13. [Biblioteca e Laudos (`features/biblioteca/`, `features/laudos/`)](#13-biblioteca-e-laudos-featuresbiblioteca-featureslaudos)
14. [Relatórios (`features/relatorios/`)](#14-relatórios-featuresrelatorios)
15. [Configurações / Auditoria (`features/configuracoes/`)](#15-configurações--auditoria-featuresconfiguracoes)
16. [Histórico de alterações (`features/historico/`)](#16-histórico-de-alterações-featureshistorico)

---

## 1. Visão geral e padrões do projeto

### Estrutura de pastas

```
frontend/src/
├── main.tsx                  # Ponto de entrada (providers globais)
├── App.tsx                   # Mapa de rotas
├── components/
│   ├── layout/app-layout.tsx # Casca da aplicação (sidebar + header)
│   └── ui/                   # Componentes visuais reutilizáveis
├── lib/                      # Código utilitário (API, storage, helpers)
├── routes/protected-route.tsx# Guarda de rotas autenticadas
└── features/                 # Um diretório por módulo de negócio
    ├── auth/  ├── busca/  ├── crm/  ├── dashboard/  ├── agenda/
    ├── processos/  ├── financeiro/  ├── biblioteca/  ├── laudos/
    ├── relatorios/  ├── configuracoes/  ├── historico/  └── usuarios/
```

### Padrões que se repetem em todo o projeto

Estes padrões aparecem em praticamente todas as páginas — são descritos aqui uma vez
e referenciados nas seções específicas:

- **Busca de dados (React Query)**: toda leitura da API usa `useQuery` com uma
  `queryKey` que identifica o dado (ex.: `["clientes"]`, `["processos", id]`). O React
  Query cacheia o resultado e evita requisições repetidas.
- **Escrita de dados (mutations)**: toda criação/edição/remoção usa `useMutation`. No
  `onSuccess`, a página chama `queryClient.invalidateQueries({ queryKey: [...] })` para
  forçar a recarga da lista afetada — é assim que a tela "se atualiza sozinha" depois de
  salvar. No `onError`, extrai a mensagem `detail` da resposta da API (via
  `isAxiosError`) e mostra em um `<p>` vermelho; se não houver detalhe, usa uma
  mensagem genérica em português.
- **Permissões (RBAC)**: cada página consulta `temPermissao("modulo:acao")` do contexto
  de autenticação. Botões de criação/edição/remoção e colunas de "Ações" só são
  renderizados quando o usuário tem a permissão de escrita do módulo (`crm:write`,
  `processos:write` etc.). A leitura é garantida pela própria rota/backend.
- **Dialogs de formulário**: os formulários de criação/edição são componentes
  `*FormDialog` renderizados condicionalmente (`{dialogAberto && <XFormDialog ... />}`)
  sobre um fundo escurecido (`fixed inset-0 bg-black/40`). Convenção interna:
  - Prop `x: Entidade | null` — `null` = modo criação; objeto = modo edição
    (`const editando = x !== null`).
  - Um `useState` por campo, inicializado com o valor atual quando editando.
  - `handleSubmit(e)`: previne o submit nativo, limpa o erro e dispara a mutation.
  - A mutation faz `POST` (criar) ou `PATCH` (editar) conforme `editando`; campos
    opcionais vazios são convertidos para `null` antes do envio.
- **Campos vazios na exibição**: valores nulos aparecem como `"—"` (travessão).
- **Datas**: datas puras (`YYYY-MM-DD`) são formatadas com `formatarDataLocal` (sem
  conversão de fuso); timestamps usam `new Date(x).toLocaleString("pt-BR")`.
- **Moeda**: `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- **CSV**: toda exportação usa `exportarCsv` de `lib/utils.ts`, com `;` como separador
  (compatível com Excel pt-BR — ver seção 3).

---

## 2. Ponto de entrada e roteamento

### `src/main.tsx`

Ponto de entrada da aplicação. Não define funções próprias; monta a árvore de
providers globais e renderiza no elemento `#root`:

| Provider | Função |
|---|---|
| `StrictMode` | Ativa verificações extras do React em desenvolvimento. |
| `BrowserRouter` | Habilita o roteamento por URL (React Router). |
| `QueryClientProvider` | Disponibiliza o cache global do React Query (`new QueryClient()`). |

### `src/App.tsx`

**`App()`** — componente raiz que define o mapa de rotas da aplicação inteira:

- **Rotas públicas**: `/login`, `/esqueci-senha`, `/redefinir-senha`.
- **Rotas protegidas** (dentro de `<ProtectedRoute />`, que injeta o layout):
  - `/dashboard`
  - `/usuarios`
  - `/crm` (layout com abas) → `prospeccao` (padrão), `clientes`, `advogados`,
    `escritorios`, `contatos`, `magistrados`, `comarcas`
  - `/processos` e `/processos/:id` (detalhe)
  - `/agenda`, `/financeiro`
  - `/biblioteca` (layout com abas) → `modelos` (padrão), `laudos`
  - `/laudos/:id` (detalhe/edição do laudo)
  - `/relatorios` — carregada com `lazy()` + `Suspense` (o código do Recharts só é
    baixado quando o usuário abre a página, reduzindo o bundle inicial)
  - `/configuracoes` (auditoria)
- **Fallbacks**: `/` e qualquer rota desconhecida redirecionam para `/dashboard`.

### `src/routes/protected-route.tsx`

**`ProtectedRoute()`** — guarda de autenticação usada como rota-pai de todas as telas
internas. Três estados possíveis:

1. `carregando === true` (ainda validando o token salvo) → mostra "Carregando..."
   centralizado, sem decidir nada ainda (evita "piscar" a tela de login).
2. Sem usuário autenticado → redireciona para `/login` (`<Navigate replace />`).
3. Autenticado → renderiza `<AppLayout />` (que por sua vez renderiza a rota filha
   através do `<Outlet />`).

---

## 3. Biblioteca base (`lib/`)

### `src/lib/api.ts`

Cliente HTTP central — **todas** as chamadas à API passam por aqui.

- **`api`** — instância do Axios com `baseURL` vinda de `VITE_API_URL` (fallback:
  `http://localhost:8000/api/v1`).

- **Interceptor de requisição** (anônimo) — antes de cada chamada, lê o access token do
  `authStorage` e, se existir, adiciona o header `Authorization: Bearer <token>`. É por
  isso que nenhuma página precisa se preocupar com autenticação nas chamadas.

- **`refreshAccessToken()`** — troca o refresh token por um novo par de tokens via
  `POST /auth/refresh` (usa `axios` puro, não a instância `api`, para não entrar em
  loop de interceptor). Salva os novos tokens no `authStorage` e retorna o novo access
  token, ou `null` se não houver refresh token salvo.

- **Interceptor de resposta** (anônimo) — implementa a **renovação automática de
  sessão**: quando uma chamada retorna `401`:
  1. Marca a requisição original com `_retry` (para tentar só uma vez).
  2. Chama `refreshAccessToken()`. A variável `refreshing` guarda a *promise* em
     andamento — se várias chamadas falharem com 401 ao mesmo tempo, todas aguardam a
     **mesma** renovação em vez de disparar várias.
  3. Se renovou, repete a requisição original com o novo token.
  4. Se não conseguiu renovar, limpa os tokens e redireciona o navegador para
     `/login` (sessão expirada de verdade).

### `src/lib/auth-storage.ts`

**`authStorage`** — pequeno wrapper sobre o `localStorage` para os tokens JWT, com as
chaves `perito-os:access-token` e `perito-os:refresh-token`:

| Função | O que faz |
|---|---|
| `getAccessToken()` | Retorna o access token salvo (ou `null`). |
| `getRefreshToken()` | Retorna o refresh token salvo (ou `null`). |
| `setTokens(access, refresh)` | Salva os dois tokens (usado no login e na renovação). |
| `clear()` | Remove os dois tokens (usado no logout e quando a sessão expira). |

### `src/lib/utils.ts`

- **`cn(...inputs)`** — combina classes CSS condicionalmente (`clsx`) e resolve
  conflitos de utilitários Tailwind (`tailwind-merge`). Ex.: `cn("p-4", cond && "p-6")`
  resulta em `"p-6"` quando `cond` é verdadeiro, sem duplicar o padding. Usada por
  praticamente todos os componentes de UI.

- **`formatarDataLocal(data)`** — converte `"YYYY-MM-DD"` em `"DD/MM/AAAA"` fazendo
  *split* da string, **sem** passar por `new Date()`. Motivo: `new Date("2026-08-15")`
  interpreta a data como UTC e, no fuso do Brasil, exibiria o dia anterior. Esta função
  evita esse deslocamento.

- **`exportarCsv(nomeArquivo, cabecalhos, linhas)`** — gera e baixa um arquivo CSV no
  navegador. Detalhes importantes:
  - **Separador `;`** — o Excel em português trata `,` como separador decimal, então um
    CSV separado por vírgula com valores como `8500,00` quebraria as colunas. (Este foi
    um bug real reportado em uso e corrigido — qualquer exportação nova deve usar esta
    função.)
  - **`escapar(valor)`** (função interna) — envolve em aspas duplas os valores que
    contêm `;`, `"` ou quebra de linha, duplicando aspas internas (`"` → `""`),
    conforme o padrão CSV.
  - **BOM UTF-8** no início do arquivo — sem ele, o Excel abriria acentos corrompidos.
  - Linhas unidas com `\r\n` e download disparado via `<a download>` + `Blob` +
    `URL.createObjectURL` (revogada em seguida para liberar memória).

---

## 4. Componentes de UI (`components/ui/`)

Componentes visuais básicos, estilizados com Tailwind, usados em todas as telas.
Todos aceitam `className` extra (mesclada via `cn`) e repassam as demais props ao
elemento HTML nativo.

### `button.tsx`

- **`buttonVariants`** — definição de variantes com `class-variance-authority`:
  - `variant`: `default` (azul primário), `outline` (borda, fundo transparente),
    `ghost` (sem borda, só hover), `destructive` (vermelho, para remoções).
  - `size`: `default` (h-10), `sm` (h-9), `lg` (h-11).
- **`Button`** — `<button>` com as variantes acima; desabilitado fica com 50% de
  opacidade e ignora cliques. Usa `forwardRef` para permitir foco programático.

### `card.tsx`

Família de contêineres para blocos de conteúdo:

| Componente | O que renderiza |
|---|---|
| `Card` | `<div>` com borda, cantos arredondados e sombra leve — o "cartão" em si. |
| `CardHeader` | Cabeçalho com padding e espaçamento vertical entre título/descrição. |
| `CardTitle` | `<h3>` semibold. |
| `CardDescription` | `<p>` menor e acinzentado. |
| `CardContent` | Corpo do cartão (padding lateral, sem padding no topo). |

### `input.tsx` / `textarea.tsx` / `label.tsx`

- **`Input`** — `<input>` padronizado (altura 10, borda, anel de foco azul).
- **`Textarea`** — mesmo estilo para `<textarea>` (usada em observações e no editor de
  conteúdo do laudo).
- **`Label`** — `<label>` pequeno e semibold, sempre associado via `htmlFor`.

---

## 5. Layout da aplicação (`components/layout/`)

### `app-layout.tsx`

- **`itensNavegacao`** — lista que define o menu lateral: rota, rótulo, ícone
  (lucide-react), flag `disponivel` (o item "Inteligência Artificial" existe mas fica
  desabilitado com o tooltip "Disponível em uma próxima fase") e, opcionalmente, uma
  `permissao` exigida (ex.: "Configurações" exige `auditoria:read`).

- **`AppLayout()`** — a "casca" de todas as telas internas:
  1. Filtra `itensNavegacao` pelo RBAC (`itensVisiveis`): itens com `permissao`
     definida só aparecem se `temPermissao()` retornar verdadeiro.
  2. **Sidebar** (esquerda, fundo azul primário): logotipo "Perito OS", os links de
     navegação (com destaque no item ativo via `NavLink`) e o botão **Sair** no rodapé,
     que chama `logout()` do contexto de autenticação.
  3. **Header** (topo): o campo de **busca global** (`<BuscaGlobal />`, seção 8) à
     esquerda e o nome + perfil do usuário logado à direita.
  4. **`<main>`**: renderiza a rota filha atual (`<Outlet />`).

---

## 6. Autenticação (`features/auth/`)

### `types.ts`

Interfaces espelhando as respostas da API: **`Perfil`** (id, nome, descrição, lista de
`permissoes`), **`Usuario`** (dados cadastrais + perfil aninhado + `ultimo_login_em`) e
**`LoginResponse`** (par de tokens + usuário).

### `auth-context.tsx`

Contexto global de autenticação — fonte única da verdade sobre "quem está logado".

- **`AuthProvider({ children })`** — provê o contexto para a aplicação inteira
  (envolve as rotas no `App.tsx`). Internamente:
  - Estado: `usuario` (ou `null`) e `carregando`.
  - **`useEffect` de inicialização** — ao abrir/recarregar a página: se há access token
    salvo, chama `GET /auth/me` para validá-lo e recuperar o usuário; se a chamada
    falha, limpa os tokens. Ao final, `carregando` vira `false` — é esse flag que o
    `ProtectedRoute` espera antes de decidir redirecionar.
  - **`login(email, senha)`** — envia `POST /auth/login` como formulário
    `x-www-form-urlencoded` com campos `username`/`password` (formato OAuth2 exigido
    pelo backend). Em caso de sucesso, salva os tokens no `authStorage` e popula
    `usuario`. Erros propagam para quem chamou (a página de login trata os códigos).
  - **`logout()`** — limpa os tokens e zera o usuário (o `ProtectedRoute` então
    redireciona para `/login` naturalmente).
  - **`temPermissao(permissao)`** — verificação de RBAC usada em todo o frontend:
    retorna `true` se o perfil do usuário contém a permissão exata **ou** o curinga
    `"*"` (perfil admin).

- **`useAuth()`** — hook de acesso ao contexto; lança erro claro se usado fora do
  `AuthProvider` (proteção contra erro de programação).

### `login-page.tsx`

**`LoginPage()`** — tela de entrada do sistema.

- Se o usuário **já está logado**, redireciona imediatamente para o destino original
  (`location.state.from`) ou `/dashboard` — impede voltar à tela de login pela URL.
- Exibe um aviso verde "Senha redefinida com sucesso" quando chega vindo do fluxo de
  redefinição (`location.state.senhaRedefinida`).
- **`handleSubmit(e)`** — chama `login()` do contexto e navega para `/dashboard`. O
  tratamento de erro diferencia os códigos HTTP:
  - `401` → "E-mail ou senha inválidos."
  - `403` → "Usuário inativo. Contate o administrador."
  - `429` → mensagem do rate limiting do backend (bloqueio por excesso de tentativas).
  - Qualquer outro → "Não foi possível conectar ao servidor."
  Enquanto envia, o botão mostra "Entrando..." e fica desabilitado.

### `esqueci-senha-page.tsx`

**`EsqueciSenhaPage()`** — solicita o link de redefinição de senha.

- **`handleSubmit(e)`** — envia `POST /auth/esqueci-senha` com o e-mail digitado.
- Após o envio, troca o formulário por uma mensagem **neutra** ("Se o e-mail existir em
  nossa base, um link foi enviado") — de propósito, a tela não revela se o e-mail está
  ou não cadastrado (proteção contra enumeração de usuários, espelhando o backend).

### `redefinir-senha-page.tsx`

**`RedefinirSenhaPage()`** — destino do link enviado por e-mail
(`/redefinir-senha?token=...`).

- Lê o `token` da query string; **sem token**, renderiza a tela "Link inválido" com
  atalho para solicitar um novo.
- **`handleSubmit(e)`** — valida no cliente que as duas senhas digitadas coincidem;
  então envia `POST /auth/redefinir-senha` com `{ token, nova_senha }`. Sucesso navega
  para `/login` com `state.senhaRedefinida = true` (que exibe o aviso verde lá).
  `400` significa token expirado/já usado → "Link inválido ou expirado."
- Os campos exigem no mínimo 8 caracteres (`minLength`), casando com a regra da API.

### `features/usuarios/` (gestão de usuários)

**`usuarios-page.tsx` — `UsuariosPage()`** — listagem de usuários do sistema
(rota `/usuarios`).

- Queries: `["usuarios"]` (lista) e `["perfis"]` (só carregada se o usuário pode
  escrever — `enabled: podeEscrever` evita chamada desnecessária para quem só lê).
- **`inativarMutation`** — `DELETE /usuarios/{id}`. Importante: o backend faz
  *soft-delete* (o usuário é **inativado**, não apagado — preserva histórico e
  auditoria); por isso o botão se chama "Inativar" e só aparece para usuários ativos.
- **`abrirCriacao()` / `abrirEdicao(usuario)`** — abrem o dialog zerado ou preenchido.
- Tabela: nome, e-mail, badge do perfil, badge de status (verde "Ativo" / vermelho
  "Inativo") e ações (restritas a `usuarios:write`).

**`usuario-form-dialog.tsx` — `UsuarioFormDialog({ usuario, perfis, onClose })`** —
criação/edição de usuário.

- **`mutation`** — na criação, `POST /usuarios` com nome, e-mail, senha e perfil. Na
  edição, `PATCH /usuarios/{id}` com nome/perfil e **senha somente se preenchida**
  (campo "Nova senha (opcional)" — vazio mantém a atual; o spread condicional
  `...(senha ? { senha } : {})` implementa isso).
- O campo e-mail fica **desabilitado na edição** (e-mail é o identificador de login,
  não pode ser trocado).
- **`handleSubmit(e)`** — padrão dos dialogs (seção 1).

---

## 7. Dashboard (`features/dashboard/`)

### `types.ts`

**`DashboardKPIs`** — formato da resposta de `GET /dashboard`: `processos_ativos`,
`nomeacoes_pendentes`, `laudos_em_andamento`, `honorarios_a_receber`,
`prazos_proximos_7_dias`, `usuarios_ativos`.

### `dashboard-page.tsx`

- **`cartoes`** — configuração dos 5 cartões numéricos (chave do KPI, rótulo, ícone).
- **`DashboardPage()`** — busca os KPIs (`queryKey: ["dashboard-kpis"]`) e renderiza a
  grade de cartões. Enquanto carrega, cada valor mostra "—". O cartão "Honorários a
  receber" é tratado à parte por exigir formatação de moeda. A `queryKey`
  `dashboard-kpis` é invalidada pelas telas de Financeiro quando um lançamento muda —
  assim o dashboard reflete pagamentos sem recarregar a página.

---

## 8. Busca global (`features/busca/`)

Implementa o RF014 — pesquisar qualquer entidade a partir de um único campo no topo da
aplicação.

### `types.ts`

- **`TipoResultadoBusca`** — os 8 tipos possíveis: `processo`, `cliente`, `advogado`,
  `escritorio`, `contato`, `magistrado`, `comarca`, `laudo`.
- **`ResultadoBusca`** — item retornado pela API: tipo, id, `titulo` (texto principal),
  `subtitulo` (complemento opcional, ex.: OAB do advogado) e `url` (rota interna de
  destino).
- **`LABEL_TIPO_BUSCA`** — tradução tipo → rótulo exibido no badge ("Escritório" etc.).

### `busca-global.tsx`

**`BuscaGlobal()`** — campo de busca com dropdown de resultados, renderizado no header
do `AppLayout`.

- **Debounce**: um `useEffect` copia o texto digitado para `termoDebounced` apenas
  300 ms após a última tecla (o timer é cancelado a cada tecla nova). É o
  `termoDebounced` que alimenta a query — evita uma chamada de API por caractere.
- **Query**: `GET /busca?q=<termo>` com `queryKey: ["busca", termoDebounced]` e
  `enabled` somente com **2+ caracteres** (mesma regra mínima da API). Cada termo já
  buscado fica em cache — voltar a digitar o mesmo termo não refaz a chamada.
- **Fechar ao clicar fora**: um `useEffect` registra `mousedown` no documento e fecha o
  dropdown quando o clique acontece fora do contêiner (`containerRef`). A tecla
  `Escape` também fecha (handler `onKeyDown` no input).
- **`selecionar(resultado)`** — ao clicar em um resultado: fecha o dropdown, limpa o
  campo e navega para `resultado.url` (ex.: `/processos/3` ou `/crm/advogados`).
- **Estados do dropdown**: "Buscando..." durante a chamada; "Nenhum resultado
  encontrado." para lista vazia; senão, um botão por resultado com badge do tipo +
  título + subtítulo.
- **Observação de RBAC**: o filtro por permissão é feito **no backend** — o dropdown só
  mostra tipos de entidade que o usuário logado tem permissão de ler.

---

## 9. CRM (`features/crm/`)

### `crm-layout.tsx`

- **`abas`** — as 7 abas do módulo: Prospecção, Clientes, Advogados, Escritórios,
  Contatos, Magistrados, Comarcas.
- **`CrmLayout()`** — cabeçalho do módulo + navegação em abas (sublinhado azul na aba
  ativa via `NavLink`) + `<Outlet />` para a aba atual.

### `types.ts`

Interfaces das entidades do CRM: **`Comarca`** (nome, UF, tribunal),
**`Magistrado`** (dados + comarca aninhada obrigatória), **`Escritorio`** (nome, CNPJ,
contato, cidade/UF), **`Advogado`** (nome, OAB, contato + escritório aninhado
*opcional*), **`Contato`** (nome, cargo, organização, contato), **`Cliente`** (nome,
tipo PF/PJ, documento, contato), **`Prospeccao`** (nome, estágio, origem, cliente e
responsável opcionais). Constante **`ESTAGIOS_PROSPECCAO`** — os 5 estágios do funil
com rótulos: prospecção → contato → resposta → nomeação / perdida.

### Páginas de listagem (padrão comum)

`clientes-page.tsx`, `advogados-page.tsx`, `escritorios-page.tsx`, `contatos-page.tsx`,
`magistrados-page.tsx` e `comarcas-page.tsx` seguem **exatamente o mesmo esqueleto**
(descrito na seção 1); cada uma define:

| Função/objeto | O que faz |
|---|---|
| `useQuery` da entidade | `GET /<entidade>` — carrega a lista exibida na tabela. |
| `removerMutation` | `DELETE /<entidade>/{id}` + invalidação da lista. Erros da API (ex.: bloqueio por vínculo) aparecem na tela. |
| `abrirCriacao()` | Zera `emEdicao` e abre o dialog em modo criação. |
| `abrirEdicao(x)` | Guarda o registro em `emEdicao` e abre o dialog preenchido. |

Particularidades de cada página:

- **`clientes-page.tsx` (`ClientesPage`)** — `LABEL_TIPO` traduz `pessoa_fisica` /
  `pessoa_juridica`. Colunas: Nome, Tipo, Documento, Contato (e-mail · telefone).
- **`advogados-page.tsx` (`AdvogadosPage`)** — além da lista de advogados, carrega
  `["escritorios"]` (apenas com `crm:write`) para popular o select do formulário.
  Colunas: Nome, OAB, Escritório (nome ou "—"), Contato.
- **`escritorios-page.tsx` (`EscritoriosPage`)** — colunas: Nome, CNPJ, Cidade/UF,
  Contato. A remoção pode retornar **409** do backend quando há advogados vinculados —
  a mensagem "Não é possível remover: existem advogados vinculados a este escritório"
  é exibida na tela.
- **`contatos-page.tsx` (`ContatosPage`)** — colunas: Nome, Cargo, Organização, Contato.
- **`magistrados-page.tsx` (`MagistradosPage`)** — carrega `["comarcas"]` para o
  formulário; como a comarca é **obrigatória** para magistrado, o botão "Novo
  magistrado" fica desabilitado (com aviso) enquanto não existir nenhuma comarca.
  Colunas: Nome, Cargo/Vara, Comarca (nome/UF), Contato.
- **`comarcas-page.tsx` (`ComarcasPage`)** — colunas: Nome, UF, Tribunal. A remoção
  retorna 409 quando há magistrados vinculados.

### Dialogs de formulário do CRM

Todos seguem o padrão de dialog da seção 1; abaixo, o que cada um tem de específico:

- **`cliente-form-dialog.tsx` (`ClienteFormDialog`)** — campos: nome*, tipo
  (select PF/PJ), CPF/CNPJ, e-mail, telefone. Opcionais viram `null`.
- **`advogado-form-dialog.tsx` (`AdvogadoFormDialog`)** — campos: nome*, OAB,
  escritório (select populado pela página; opção "Sem escritório" envia
  `escritorio_id: null` — é assim que se **desvincula** um advogado), e-mail, telefone,
  observações.
- **`escritorio-form-dialog.tsx` (`EscritorioFormDialog`)** — campos: nome*, CNPJ,
  cidade, UF (2 letras, convertida para maiúsculas ao digitar), e-mail, telefone,
  observações.
- **`contato-form-dialog.tsx` (`ContatoFormDialog`)** — campos: nome*, cargo,
  organização, e-mail, telefone, observações.
- **`magistrado-form-dialog.tsx` (`MagistradoFormDialog`)** — campos: nome*, cargo,
  vara, comarca* (select obrigatório), e-mail, telefone.
- **`comarca-form-dialog.tsx` (`ComarcaFormDialog`)** — campos: nome*, UF* (2 letras,
  maiúsculas automáticas), tribunal.

### Prospecção (funil kanban)

**`prospeccao-page.tsx` — `ProspeccaoPage()`** — visão de funil, diferente das outras
listas:

- Renderiza **uma coluna por estágio** (`ESTAGIOS_PROSPECCAO`), com contador de itens.
  Cada prospecção vira um card com nome, cliente e responsável.
- **`mudarEstagioMutation`** — `PATCH /prospeccoes/{id}` com o novo `estagio`. A troca
  é feita por um select dentro do próprio card (visível só com `crm:write`) — é o
  mecanismo de "mover no funil".
- Botão "Nova prospecção" abre o dialog (só criação; a edição do estágio é inline).

**`prospeccao-form-dialog.tsx` — `ProspeccaoFormDialog({ onClose })`** — criação de
prospecção: nome/empresa*, origem, contato, cliente vinculado (select) e responsável
(select de usuários, **pré-selecionado com o usuário logado**). `POST /prospeccoes`.

---

## 10. Processos (`features/processos/`)

### `types.ts`

- **`SituacaoProcesso`** + **`SITUACOES_PROCESSO`** — as 7 etapas do fluxo do processo,
  com rótulos: aceite → análise → coleta → perícia → laudo → entrega → arquivado.
- **`Processo`** — número, partes, objeto, especialidade, prazo, situação + comarca
  (obrigatória), magistrado e cliente (opcionais) aninhados.
- **`Documento`** — arquivo comum do processo (nome original, categoria, tamanho,
  content-type, quem enviou, quando).
- **`Evidencia`** — arquivo do módulo de Evidências (RF008): além dos metadados do
  arquivo, carrega `tipo` (foto/vídeo/áudio/pdf/word/planilha/log/outro),
  `midia_origem` (HD/SSD/pendrive/outro), `descricao`, o **`hash_sha256`** de
  integridade calculado pelo backend no upload e o `responsavel`.
- **`TIPOS_EVIDENCIA`** / **`MIDIAS_ORIGEM_EVIDENCIA`** — listas valor/rótulo para os
  selects e badges.

### `processos-page.tsx`

**`ProcessosPage()`** — listagem de processos (rota `/processos`).

- Query `["processos"]`; `removerMutation` (`DELETE /processos/{id}` — o backend
  bloqueia com 409 se houver documentos/compromissos vinculados);
  `abrirCriacao()`/`abrirEdicao(processo)` para o dialog.
- **`exportar()`** — gera `processos.csv` via `exportarCsv` com Número, Comarca,
  Cliente, Especialidade, Prazo e Situação (rótulos traduzidos por `LABEL_SITUACAO`).
- O número do processo na tabela é um link para a página de detalhe.

### `processo-form-dialog.tsx`

**`ProcessoFormDialog({ processo, onClose })`** — criação/edição dos dados cadastrais
do processo.

- Carrega três listas para os selects: comarcas, magistrados e clientes.
- Campos: número* e especialidade; comarca* (obrigatória), magistrado e cliente
  (opcionais); prazo (date); partes e objeto.
- **`mutation`** — `POST /processos` ou `PATCH /processos/{id}`. O backend responde 409
  para número de processo duplicado; a mensagem aparece no dialog.

### `processo-detail-page.tsx`

**`ProcessoDetailPage()`** — página mais completa do sistema (rota `/processos/:id`).
Concentra tudo que orbita um processo: dados, documentos, **evidências**, agenda,
laudos e histórico.

Função auxiliar do módulo:

- **`formatarBytes(bytes)`** — formata tamanho de arquivo de forma legível
  (`B` / `KB` / `MB` com 1 casa decimal).

Permissões usadas: `processos:write` (documentos/evidências/situação),
`agenda:write` (compromissos), `laudos:write` (criar laudo).

**Queries** (todas com o `processoId` na chave, então cada processo tem seu cache):

| Query | Endpoint | Alimenta |
|---|---|---|
| `["processos", id]` | `GET /processos/{id}` | Cabeçalho e cartão "Detalhes". |
| `["documentos", id]` | `GET /processos/{id}/documentos` | Cartão "Documentos". |
| `["evidencias", id]` | `GET /processos/{id}/evidencias` | Cartão "Evidências". |
| `["agenda", {processoId}]` | `GET /agenda?processo_id=` | Cartão "Agenda do processo". |
| `["laudos", {processoId}]` | `GET /laudos?processo_id=` | Cartão "Laudos". |

**Mutations e funções:**

- **`situacaoMutation`** — muda a etapa do processo pelo select do cabeçalho
  (`PATCH /processos/{id}` com `situacao`). Invalida também o histórico — a troca de
  situação gera registro no RF019 e o cartão de histórico atualiza na hora.
- **`uploadMutation`** — upload de **documento** comum: monta `FormData` com o arquivo
  e envia `POST /processos/{id}/documentos`. Ao concluir, limpa o `<input type=file>`
  (via `fileInputRef`) e recarrega a lista.
- **`removerDocumentoMutation`** — `DELETE /documentos/{id}`.
- **`uploadEvidenciaMutation`** — upload de **evidência** (RF008): monta `FormData` com
  o arquivo **mais** os campos do formulário de evidência — `tipo` (obrigatório),
  `midia_origem` e `descricao` (opcionais) — e envia
  `POST /processos/{id}/evidencias`. O backend calcula o hash SHA-256 do conteúdo no
  ato do upload. Ao concluir, limpa a descrição e o input de arquivo.
- **`removerEvidenciaMutation`** — `DELETE /evidencias/{id}` (remove também o objeto no
  storage, via backend).
- **`criarCompromissoMutation`** — cria compromisso já vinculado ao processo
  (`POST /agenda`), convertendo o `datetime-local` do formulário para ISO/UTC. Ao
  salvar, reseta o mini-formulário.
- **`concluirCompromissoMutation`** — marca/desmarca o checkbox "Concluído"
  (`PATCH /agenda/{id}`).
- **`baixarDocumento(doc)` / `baixarEvidencia(ev)`** — baixam o arquivo autenticado:
  como o download exige o header Authorization, não dá para usar um link direto; a
  função busca o binário via `api.get(..., { responseType: "blob" })`, cria uma URL
  temporária (`URL.createObjectURL`), dispara o clique em um `<a download>` com o nome
  original do arquivo e revoga a URL.

**Renderização por cartão:**

- **Detalhes** — especialidade, prazo, partes, objeto.
- **Documentos** — input de upload (só com permissão) + lista com nome, tamanho
  formatado e botões de baixar/remover.
- **Evidências** — formulário de captura (selects de tipo e mídia de origem, campo de
  descrição, input de arquivo) + lista onde cada item mostra: nome, badge com
  tipo · mídia · tamanho · responsável, descrição e o **hash SHA-256 truncado**
  (16 caracteres + "…", com o hash completo no `title`/tooltip — para conferência de
  integridade/cadeia de custódia).
- **Agenda do processo** — mini-formulário inline (título, tipo, data/hora, local) +
  lista de compromissos com checkbox de conclusão (concluídos ficam esmaecidos).
- **Laudos** — lista com link para cada laudo e badge de status + botão "Novo laudo"
  (abre o `LaudoFormDialog` com o `processoId` já fixado).
- **Histórico de alterações** — `<HistoricoCard entidade="processos" ...>` com
  `traduzirValor` que converte valores brutos em rótulos legíveis (ex.: `pericia` →
  "Perícia"; datas → DD/MM/AAAA).

---

## 11. Agenda (`features/agenda/`)

### `types.ts`

**`TipoCompromisso`** + **`TIPOS_COMPROMISSO`** — audiência, perícia, diligência,
entrega de laudo, reunião, lembrete. **`Compromisso`** — título, tipo, data/hora, local,
concluído, processo e responsável opcionais.

### `agenda-page.tsx`

**`AgendaPage()`** — agenda geral (rota `/agenda`), com todos os compromissos de todos
os processos.

- Query `["agenda"]` (`GET /agenda`).
- **`concluirMutation`** — alterna o checkbox "Concluído" (`PATCH /agenda/{id}`);
  linhas concluídas ficam com opacidade reduzida.
- **`removerMutation`** — `DELETE /agenda/{id}` (ícone de lixeira).
- Tabela: Data/Hora (`toLocaleString pt-BR`), Título (com local em linha menor), Tipo
  traduzido, link para o processo vinculado, checkbox, ações.

### `agenda-form-dialog.tsx`

**`AgendaFormDialog({ onClose })`** — criação de compromisso avulso: título*, tipo,
data/hora* (`datetime-local`, convertida para ISO no envio), local e processo vinculado
(select opcional). `POST /agenda`.

---

## 12. Financeiro (`features/financeiro/`)

### `types.ts`

- **`TipoLancamento`** (`entrada`/`saida`) e **`StatusLancamento`**
  (`pendente`/`pago`/`atrasado` — o status é **calculado pelo backend** a partir de
  `pago_em` e `vencimento`; o frontend só exibe).
- **`TipoImposto`** + **`TIPOS_IMPOSTO`** — classificação de imposto do lançamento:
  DARF-INSS, DARF-IRPF, ISS, Outro (RF "DARF/Impostos").
- **`Lancamento`** — descrição, valor (string decimal), vencimento, `pago_em`,
  processo opcional, status + `tipo_imposto` e `competencia` (ambos `null` para
  lançamentos comuns).
- **`LABEL_STATUS`** / **`LABEL_TIPO_IMPOSTO`** — mapas de rótulos.
- **`formatarCompetencia(competencia)`** — converte a data ISO da competência
  (`"2026-07-01"`) no formato fiscal brasileiro `"07/2026"` (mês/ano).

### `financeiro-page.tsx`

**`FinanceiroPage()`** — controle financeiro (rota `/financeiro`).

- **Query** `["financeiro", { filtroTipo, apenasImpostos }]` — os filtros fazem parte
  da chave, então cada combinação é cacheada separadamente. Monta os query params:
  `tipo=entrada|saida` e/ou `somente_impostos=true`.
- **`resumo`** (`useMemo`) — soma entradas, saídas e saldo **da lista atualmente
  filtrada** (por isso ao filtrar por impostos o resumo mostra só o total de
  impostos). Recalcula apenas quando a lista muda.
- **Filtros** — botões-pílula "Todos / Entradas / Saídas" (excludentes, estado
  `filtroTipo`) + o botão independente **"Impostos (DARF)"** (liga/desliga
  `apenasImpostos`, combinável com os anteriores).
- **`marcarPagoMutation`** — botão "Marcar pago" envia `PATCH` com `pago_em = hoje`
  (formato `YYYY-MM-DD`); "Desfazer" envia `pago_em: null`. Invalida também
  `dashboard-kpis` (o cartão "Honorários a receber" depende disso).
- **`removerMutation`** — `DELETE /financeiro/{id}`.
- **`exportar()`** — `financeiro.csv` com Descrição, Tipo, Valor (decimal com vírgula),
  Vencimento, Processo, Status, **Tipo de Imposto** e **Competência**.
- Tabela: na coluna Descrição, lançamentos de imposto ganham uma sublinha
  "DARF - INSS · 07/2026"; Status é um badge colorido (âmbar/verde/vermelho conforme
  `COR_STATUS`).

### `lancamento-form-dialog.tsx`

**`LancamentoFormDialog({ onClose })`** — criação de lançamento.

- Campos base: tipo (entrada/saída), descrição*, valor* (número, mínimo 0,01),
  vencimento* (date), processo vinculado (select opcional).
- **Campos de imposto**: select "Tipo de imposto (opcional)"; ao escolher um tipo, o
  campo **"Competência"** (`<input type="month">`) aparece condicionalmente.
- **`mutation`** — `POST /financeiro`. A competência escolhida (`"2026-07"`) é enviada
  como primeiro dia do mês (`"2026-07-01"`, formato date da API); se nenhum tipo de
  imposto foi selecionado, `tipo_imposto` e `competencia` vão como `null`. Invalida
  `financeiro` e `dashboard-kpis`.

---

## 13. Biblioteca e Laudos (`features/biblioteca/`, `features/laudos/`)

### `biblioteca/biblioteca-layout.tsx`

**`BibliotecaLayout()`** — cabeçalho do módulo + abas "Modelos" e "Laudos" +
`<Outlet />` (mesmo padrão do `CrmLayout`).

### `biblioteca/types.ts`

**`CategoriaModelo`** + **`CATEGORIAS_MODELO`** — contrato, laudo, quesito, parecer,
recibo, proposta. **`Modelo`** — nome, categoria, conteúdo (texto-base) e descrição.

### `biblioteca/modelos-page.tsx`

**`ModelosPage()`** — CRUD de modelos de documento (padrão da seção 1, permissão
`biblioteca:write`): query `["modelos"]` (`GET /biblioteca/modelos`),
`removerMutation`, `abrirCriacao()`/`abrirEdicao(modelo)`. Tabela: Nome, badge de
Categoria, Descrição.

### `biblioteca/modelo-form-dialog.tsx`

**`ModeloFormDialog({ modelo, onClose })`** — criação/edição de modelo: nome*,
categoria (select), descrição e **conteúdo*** (textarea de 10 linhas). O placeholder
orienta o uso de marcadores de variável (`{{cliente_nome}}`, `{{processo_numero}}`)
para preenchimento futuro. `POST`/`PATCH /biblioteca/modelos`.

### `laudos/types.ts`

**`StatusLaudo`** + **`STATUS_LAUDO`** — rascunho → em revisão → finalizado → entregue.
**`Laudo`** — título, conteúdo, status + processo (obrigatório), modelo de origem e
autor (opcionais).

### `laudos/laudos-page.tsx`

**`LaudosPage()`** — listagem de todos os laudos (aba dentro da Biblioteca). Query
`["laudos"]`; tabela com Título (link para o detalhe), Processo (link) e badge de
status colorido por etapa (`COR_STATUS`). Não há remoção aqui — a gestão é feita no
detalhe.

### `laudos/laudo-form-dialog.tsx`

**`LaudoFormDialog({ processoId?, onClose })`** — criação de laudo, usada em dois
contextos:

- **Da página de laudos** (sem `processoId`): mostra um select obrigatório de processo.
- **Do detalhe do processo** (com `processoId`): o processo já vem fixado e o select
  nem é renderizado (a query de processos usa `enabled` para nem ser executada).

Campos: título*, processo, e "Iniciar a partir de um modelo (opcional)" — se um modelo
for escolhido, o backend copia o conteúdo dele para o laudo novo.
**`mutation`** — `POST /laudos`; no sucesso, fecha o dialog e **navega direto para o
editor** (`/laudos/{id}` do laudo recém-criado).

### `laudos/laudo-detail-page.tsx`

**`LaudoDetailPage()`** — editor do laudo (rota `/laudos/:id`).

- Query `["laudos", id]`; um `useEffect` copia o conteúdo carregado para o estado local
  do textarea (o texto editado fica no cliente até o usuário salvar).
- **`salvarMutation`** — botão "Salvar conteúdo" envia `PATCH /laudos/{id}` com o
  texto; um aviso "Salvo." aparece por 2 segundos (`setTimeout`).
- **`statusMutation`** — select de status no cabeçalho (`PATCH` com `status`); invalida
  também o histórico (mudança de status é rastreada pelo RF019).
- **`baixarPdf()`** — exportação RF016: `GET /laudos/{id}/exportar-pdf` como blob +
  download `laudo-{id}.pdf` (mesma técnica de download autenticado da seção 10).
- **`baixarWord()`** — exportação RF017: `GET /laudos/{id}/exportar-word` como blob +
  download `laudo-{id}.docx`. (O Word preserva acentuação UTF-8 integralmente; o PDF
  usa fonte Latin-1 com substituição de caracteres fora da tabela.)
- Sem `laudos:write`, o textarea fica desabilitado e o botão de salvar some (modo
  somente leitura).
- Rodapé: `<HistoricoCard entidade="laudos">` com tradução do campo `status`.

---

## 14. Relatórios (`features/relatorios/`)

### `types.ts`

**`ContagemPorCategoria`** (categoria/total), **`FinanceiroMensal`** (mês, entradas,
saídas) e **`Indicadores`** — resposta de `GET /relatorios/indicadores` com as três
séries.

### `relatorios-page.tsx`

Página de gráficos (Recharts), carregada com *lazy loading* (ver `App.tsx`).

- Constantes de cor: `AZUL_SEQUENCIAL` e `VERDE_SEQUENCIAL` (escalas para as barras por
  categoria), `COR_ENTRADAS` (verde) e `COR_SAIDAS` (vermelho).
- **`montarSerieOrdenada(dados, ordem)`** — a API devolve apenas as categorias que têm
  registros e em ordem arbitrária; esta função reordena a série conforme a ordem
  canônica do domínio (`SITUACOES_PROCESSO`, `STATUS_LAUDO`), traduz os rótulos e
  **preenche com zero** as categorias ausentes — assim o gráfico sempre mostra todas as
  etapas, mesmo vazias.
- **`formatarMesLabel(mes)`** — converte `"2026-07"` em `"Jul/26"` para o eixo X.
- **`RelatoriosPage()`** — busca os indicadores e monta (com `useMemo` para não
  recalcular a cada render):
  1. **Processos por situação** — barras com a escala azul.
  2. **Laudos por status** — barras com a escala verde.
  3. **Fluxo de caixa mensal** — barras agrupadas Entradas × Saídas, eixo Y e tooltip
     formatados como moeda.

---

## 15. Configurações / Auditoria (`features/configuracoes/`)

### `types.ts`

**`LogAuditoria`** — método HTTP, caminho, status code, IP, usuário e data/hora de cada
requisição de escrita registrada pelo middleware de auditoria do backend (RF020).

### `auditoria-page.tsx`

- **`corStatus(status)`** — cor do badge do status HTTP: verde (2xx/3xx), âmbar (4xx),
  vermelho (5xx).
- **`LABEL_METODO`** — traduz o verbo HTTP para o usuário final: POST → "Criação",
  PATCH/PUT → "Atualização", DELETE → "Remoção".
- **`AuditoriaPage()`** — consulta `GET /auditoria` e exibe a trilha em tabela:
  Data/Hora, Usuário (ou "—" para ações não autenticadas), Ação traduzida, Recurso (o
  caminho da API, em fonte monoespaçada), Status colorido e IP. Página somente leitura;
  o acesso é restrito pela permissão `auditoria:read` (menu "Configurações" só aparece
  para quem a possui).

---

## 16. Histórico de alterações (`features/historico/`)

Frontend do RF019 — o backend grava automaticamente cada mudança de campo
(entidade, campo, valor anterior, valor novo, usuário, data); este módulo exibe essa
trilha.

### `types.ts`

- **`HistoricoAlteracao`** — uma linha do histórico: campo, valor anterior, valor novo,
  usuário e data.
- **`LABELS_CAMPO`** — dicionário técnico → humano para nomes de campo (`situacao` →
  "Situação", `comarca_id` → "Comarca", `pago_em` → "Pago em", ...).
- **`labelCampo(campo)`** — busca no dicionário; para campos não mapeados, devolve o
  nome técnico com `_` trocado por espaço (fallback legível).

### `historico-card.tsx`

- **`valorPadrao(valor)`** — formatação default de um valor do histórico: `null`/vazio
  vira "—"; strings no formato `YYYY-MM-DD` viram `DD/MM/AAAA`; o resto é exibido como
  está.
- **`HistoricoCard({ entidade, entidadeId, traduzirValor? })`** — cartão reutilizável
  plugado hoje nas páginas de **Processo** e **Laudo**:
  - Consulta `GET /historico?entidade=&entidade_id=` (a permissão exigida é resolvida
    no backend conforme a entidade).
  - Cada item é renderizado como *"**Campo** alterado de valor-antigo para
    valor-novo"*, seguido de autor e data/hora.
  - A prop opcional **`traduzirValor(campo, valor)`** permite que a página hospedeira
    substitua valores brutos por rótulos do seu domínio (ex.: o detalhe do processo
    traduz `pericia` → "Perícia"); sem ela, aplica-se `valorPadrao`.

---

## Apêndice — Convenções para novos módulos

Checklist ao criar uma nova tela no padrão do projeto:

1. Criar `features/<modulo>/types.ts` com as interfaces espelhando os schemas da API
   (campos em `snake_case`, como vêm do backend).
2. Página de listagem: `useQuery` + tabela em `Card` + estados de carregando/vazio +
   `podeEscrever = temPermissao("<modulo>:write")` condicionando botões e coluna Ações.
3. Dialog de formulário com prop `entidade | null` (criação/edição), um estado por
   campo, `handleSubmit` e mutation `POST`/`PATCH` com `invalidateQueries` no sucesso.
4. Registrar a rota em `App.tsx` (e a aba no layout do módulo, se houver).
5. Exportações CSV **sempre** via `exportarCsv` (separador `;`).
6. Datas puras **sempre** via `formatarDataLocal` (nunca `new Date("YYYY-MM-DD")`).
7. Textos, nomes de variáveis e mensagens de erro em **português do Brasil**.
