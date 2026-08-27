@echo off
REM ============================================================
REM  J.A.R.V.I.S. - Gera o executavel JARVIS.exe (Windows)
REM  Requisito: Node.js instalado (https://nodejs.org)
REM  Rode este arquivo com duplo clique.
REM ============================================================
cd /d "%~dp0"

echo.
echo  [JARVIS] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo  [JARVIS] Node.js nao encontrado. Instale em https://nodejs.org
    echo  [JARVIS] Depois rode este arquivo novamente.
    pause
    exit /b 1
)

echo  [JARVIS] Instalando ferramenta de build (pkg)...
call npm install

echo  [JARVIS] Gerando JARVIS.exe (pode demorar alguns minutos)...
call npx pkg . --targets node22-win-x64 --output dist\jarvis.exe

echo.
echo  ============================================================
echo   PRONTO! O executavel foi criado em:
echo     %cd%\dist\jarvis.exe
echo   Copie esse arquivo para qualquer lugar e de duplo clique.
echo  ============================================================
echo.
pause
