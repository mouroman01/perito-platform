# Perito OS

Plataforma para gestão completa da atividade pericial: prospecção (CRM),
processos, agenda, documentos, financeiro, biblioteca de modelos, laudos,
relatórios e auditoria.

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4 + React Query + React Router + Recharts
- **Backend**: FastAPI + SQLAlchemy + Alembic + JWT
- **Banco de dados**: PostgreSQL
- **Cache**: Redis
- **Armazenamento**: MinIO (documentos dos processos ficam no bucket configurado em `MINIO_BUCKET`)

## Como rodar (desenvolvimento)

### Com Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend (docs): http://localhost:8000/docs
- MinIO console: http://localhost:9001

### Sem Docker (Windows)

Requer PostgreSQL e MinIO instalados localmente (Redis é opcional — o rate
limiting de login cai automaticamente para memória se o Redis não estiver
disponível). No Windows, ambos podem ser instalados via winget:

```powershell
winget install PostgreSQL.PostgreSQL.18
winget install MinIO.Server
```

Use o [start.bat](start.bat) na raiz do projeto para subir backend, frontend e
o MinIO (se ainda não estiver rodando) em janelas separadas de uma vez — ele
também confere o ambiente virtual, cria os `.env` que faltarem, aplica
migrações e roda o seed automaticamente.

Manualmente:

```bash
# Backend
cd backend
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env    # ajuste DATABASE_URL, REDIS_URL, MINIO_*
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload

# Frontend (outro terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Ao rodar o seed, o backend cria automaticamente o usuário administrador inicial:

- **E-mail**: `admin@peritoos.com.br`
- **Senha**: `TrocarSenha@123` (troque no primeiro acesso)

## Backup

Rode [backup.bat](backup.bat) para gerar um dump do PostgreSQL em `/backups`
(formato custom do `pg_dump`, com rotação automática mantendo os 14 mais
recentes). Para agendar backups automáticos no Windows, crie uma tarefa no
Agendador de Tarefas apontando para esse `.bat` (ex.: diariamente às 2h).

Para restaurar um backup:

```bash
pg_restore -h localhost -U perito_os -d perito_os --clean "backups/perito_os_YYYYMMDD_HHMMSS.dump"
```

## Deploy em produção

O projeto inclui um `docker-compose.prod.yml` com um serviço `web` (Nginx
servindo o build estático do frontend e fazendo proxy reverso de `/api/` para
o backend) e o backend rodando via Gunicorn com múltiplos workers Uvicorn.

```bash
cp .env.prod.example .env   # defina POSTGRES_PASSWORD e MINIO_ROOT_PASSWORD
cp backend/.env.example backend/.env  # ajuste SECRET_KEY para um valor forte e único
docker compose -f docker-compose.prod.yml up --build -d
```

Isso expõe a aplicação na porta 80. Para HTTPS, duas opções:

1. **Nginx no host + certbot** (recomendado para um VPS Linux dedicado):
   instale o Nginx no host, use-o como proxy reverso na frente do container
   `web` (que continua ouvindo em `127.0.0.1:80`), e rode `certbot --nginx`
   para emitir e renovar o certificado automaticamente.
2. **Certificado montado no container**: adicione `443:443` aos `ports` do
   serviço `web`, monte os certificados (`/etc/letsencrypt/...`) como volume
   e adicione um `server { listen 443 ssl; ... }` em `frontend/nginx.conf`.

Segurança recomendada antes de ir para produção: `SECRET_KEY` forte e único no
`backend/.env`, senhas do Postgres/MinIO fortes no `.env` da raiz, HTTPS
obrigatório, e `BACKEND_CORS_ORIGINS` restrito ao domínio real do frontend.

## Auditoria e monitoramento

Toda requisição de escrita (`POST`/`PUT`/`PATCH`/`DELETE`) na API é registrada
em `logs_auditoria` (usuário, método, caminho, status, IP e data/hora), visível
em **Configurações → Auditoria** para o perfil `admin`. O endpoint `/health`
verifica também a conectividade com o banco de dados.

## Estrutura

```
/frontend    React + Vite
/backend     FastAPI
/docs        documentação do projeto
/uploads     documentos enviados nos processos
/evidencias  evidências periciais
/modelos     (reservado para uso futuro)
/laudos      (reservado para uso futuro)
/logs        logs de aplicação
/backups     backups do banco de dados (gerados por backup.bat)
```

## Módulos implementados (Fases 1 a 5, 7 e 8 do roadmap)

- **Infraestrutura**: Docker Compose (dev e produção), migrações Alembic, seed
- **Autenticação**: login JWT (access + refresh), RBAC por perfil (`perfis.permissoes`)
- **Usuários**: CRUD, perfis (admin / perito / assistente técnico)
- **CRM**: comarcas, magistrados, clientes, advogados, escritórios, contatos e
  funil de prospecção
- **Processos**: cadastro, situação, documentos anexados, agenda vinculada
- **Evidências (RF008)**: arquivos periciais por processo (foto, vídeo, áudio,
  PDF, planilha, log...), com mídia de origem, responsável e hash SHA-256 de
  integridade calculado no upload (cadeia de custódia)
- **Agenda**: compromissos (audiências, perícias, diligências, reuniões, lembretes)
- **Financeiro**: lançamentos (entradas/saídas), status pendente/pago/atrasado,
  e classificação de impostos (DARF-INSS, DARF-IRPF, ISS) com competência mensal
- **Biblioteca**: modelos de documentos por categoria, laudos periciais (com
  exportação em PDF e Word)
- **Busca global (RF014)**: campo único no topo que pesquisa processos,
  clientes, advogados, escritórios, contatos, magistrados, comarcas e laudos,
  respeitando as permissões do usuário
- **Inteligência Artificial (RF015)**: resumo de documentos e sugestão de
  estrutura de laudo, via API da Anthropic (Claude). Configure `ANTHROPIC_API_KEY`
  em `backend/.env`; sem a chave, os recursos respondem com aviso explicativo
- **Relatórios**: indicadores agregados (gráficos) e exportação CSV
- **Auditoria**: log de todas as ações de escrita na API, mais histórico de
  alterações campo a campo (situação de processo, status de laudo etc.)
- **Segurança**: rate limiting no login (bloqueio após 5 tentativas falhas em
  15 min) e recuperação de senha por e-mail (com link de uso único)
- **Armazenamento**: documentos dos processos ficam no MinIO, não em disco local

A **Fase 6** (Inteligência Artificial) foi iniciada com o provedor **Anthropic
(Claude)**: já há resumo de documentos e sugestão de estrutura de laudo. Os
demais recursos de IA previstos (organização de evidências, pesquisa semântica,
extração de informações, busca inteligente, checklist automático) ainda serão
implementados. Consulte o **Documento Mestre do Projeto** na raiz do repositório
para a especificação completa.

## Documentação

- [docs/DOCUMENTACAO_FRONTEND.md](docs/DOCUMENTACAO_FRONTEND.md) — referência
  técnica completa do frontend: o que faz cada arquivo e cada função, módulo a
  módulo, mais os padrões do projeto (React Query, RBAC, dialogs, CSV, datas) e
  o checklist para criar novos módulos no mesmo padrão.
