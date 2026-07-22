@echo off
chcp 65001 >nul
setlocal

echo ============================================
echo   Perito OS - Iniciando ambiente local
echo ============================================

REM Garante que o servico do PostgreSQL esta rodando (ignora erro se ja estiver ativo)
net start postgresql-x64-18 >nul 2>&1

REM Sobe o MinIO se ainda nao estiver rodando na porta 9000
REM (credenciais devem bater com MINIO_ACCESS_KEY/MINIO_SECRET_KEY em backend\.env)
set "MINIO_EXE=%LocalAppData%\Microsoft\WinGet\Packages\MinIO.Server_Microsoft.Winget.Source_8wekyb3d8bbwe\minio.exe"
powershell -NoProfile -Command "(Test-NetConnection -ComputerName localhost -Port 9000 -WarningAction SilentlyContinue).TcpTestSucceeded" | findstr /i "True" >nul
if errorlevel 1 (
    if exist "%MINIO_EXE%" (
        echo Subindo MinIO em http://localhost:9000 ...
        start "Perito OS - MinIO" cmd /k "set MINIO_ROOT_USER=perito_os && set MINIO_ROOT_PASSWORD=troque-esta-chave-em-producao && "%MINIO_EXE%" server "%~dp0.minio-data" --address :9000 --console-address :9001"
    ) else (
        echo [AVISO] MinIO nao encontrado em %MINIO_EXE% - instale com: winget install MinIO.Server
    )
) else (
    echo MinIO ja esta rodando.
)

if not exist "%~dp0backend\.venv\Scripts\activate.bat" (
    echo [ERRO] Ambiente virtual do backend nao encontrado em backend\.venv
    echo Rode: cd backend ^&^& python -m venv .venv ^&^& .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

if not exist "%~dp0backend\.env" (
    echo [AVISO] backend\.env nao encontrado, copiando de .env.example
    copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
)

if not exist "%~dp0frontend\.env" (
    echo [AVISO] frontend\.env nao encontrado, copiando de .env.example
    copy "%~dp0frontend\.env.example" "%~dp0frontend\.env" >nul
)

echo.
echo Subindo backend (FastAPI) em http://localhost:8000 ...
start "Perito OS - Backend" cmd /k "chcp 65001 >nul && cd /d %~dp0backend && call .venv\Scripts\activate && alembic upgrade head && python -m app.seed && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo Subindo frontend (Vite) em http://localhost:5173 ...
start "Perito OS - Frontend" cmd /k "chcp 65001 >nul && cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   Backend:  http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo ============================================
echo Feche as janelas abertas para encerrar os servidores.

endlocal
