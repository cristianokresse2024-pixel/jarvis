@echo off
REM ============================================================
REM  J.A.R.V.I.S. - Inicia o assistente na sua máquina (Windows)
REM  Requisito: Node.js instalado (nodejs.org)
REM ============================================================
cd /d "%~dp0"

echo.
echo  [JARVIS] Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo  [JARVIS] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

REM Se nao houver .env, cria a partir do exemplo.
if not exist ".env" (
    echo  [JARVIS] Criando .env a partir de .env.example
    copy ".env.example" ".env" >nul
)

echo  [JARVIS] Iniciando servidor...
echo  [JARVIS] Abra http://localhost:3000 no navegador
echo.
node server.js

pause
