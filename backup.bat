@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   Perito OS - Backup do banco de dados
echo ============================================

set "PROJECT_DIR=%~dp0"
set "BACKUP_DIR=%PROJECT_DIR%backups"
set "KEEP=14"

REM Credenciais do banco (ajuste se customizou backend\.env)
set "PGHOST=localhost"
set "PGPORT=5432"
set "PGUSER=perito_os"
set "PGPASSWORD=perito_os"
set "PGDATABASE=perito_os"

REM Timestamp confiavel via PowerShell (independente do locale do Windows)
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"yyyyMMdd_HHmmss\""') do set "TIMESTAMP=%%i"

REM Localiza pg_dump.exe (tenta PATH primeiro, depois instalacoes padrao do PostgreSQL)
set "PGDUMP="
where pg_dump >nul 2>&1 && set "PGDUMP=pg_dump"
if not defined PGDUMP (
    for /d %%v in ("C:\Program Files\PostgreSQL\*") do (
        if exist "%%v\bin\pg_dump.exe" set "PGDUMP=%%v\bin\pg_dump.exe"
    )
)
if not defined PGDUMP (
    echo [ERRO] pg_dump nao encontrado. Instale o PostgreSQL ou ajuste o PATH.
    pause
    exit /b 1
)

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set "OUTFILE=%BACKUP_DIR%\perito_os_%TIMESTAMP%.dump"
echo Gerando backup em %OUTFILE% ...
"%PGDUMP%" -h %PGHOST% -p %PGPORT% -U %PGUSER% -F c -f "%OUTFILE%" %PGDATABASE%

if errorlevel 1 (
    echo [ERRO] Falha ao gerar backup.
    pause
    exit /b 1
)

echo Backup concluido: %OUTFILE%

REM Rotacao: mantem apenas os %KEEP% backups mais recentes
set "INDEX=0"
for /f "delims=" %%f in ('dir /b /o-d "%BACKUP_DIR%\perito_os_*.dump" 2^>nul') do (
    set /a INDEX+=1
    if !INDEX! gtr %KEEP% (
        del "%BACKUP_DIR%\%%f"
        echo Removido backup antigo: %%f
    )
)

echo ============================================
echo Para restaurar: pg_restore -h localhost -U perito_os -d perito_os --clean "%OUTFILE%"
echo ============================================

endlocal
