@echo off
REM ============================================================
REM  J.A.R.V.I.S. - Build completo (Windows)
REM  Gera o jarvis.exe e o instalador JARVIS-Setup.exe
REM  Requisitos: Node.js 18+, internet (1a vez baixa o runtime)
REM ============================================================
setlocal
cd /d "%~dp0"
title JARVIS Build

echo.
echo  [1/4] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo  [JARVIS] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

echo.
echo  [2/4] Instalando dependencias (pkg + rcedit)...
call npm install --no-save pkg rcedit
if errorlevel 1 ( echo  [JARVIS] Falha no npm install & pause & exit /b 1 )

echo.
echo  [3/4] Gerando jarvis.exe (pode demorar alguns minutos na 1a vez)...
call npx pkg . --targets node22-win-x64 --output dist\jarvis.exe
if errorlevel 1 (
    echo  [JARVIS] Falha ao gerar jarvis.exe.
    echo  [JARVIS] Tentando com Node 18...
    call npx pkg . --targets node18-win-x64 --output dist\jarvis.exe
)
if not exist "dist\jarvis.exe" ( echo  [JARVIS] Nao foi possivel gerar o exe & pause & exit /b 1 )

echo.
echo  [4/5] Aplicando icone no jarvis.exe...
call npx rcedit "dist\jarvis.exe" --set-icon "assets\icon.ico" 2>nul
if errorlevel 1 echo  [JARVIS] Aviso: nao foi possivel aplicar o icone (seguindo sem).

echo.
echo  [5/5] Compilando instalador (NSIS)...
rem Tenta encontrar o makensis no PATH ou no diretorio padrao do NSIS
set "NSIS="
where makensis >nul 2>&1 && set "NSIS=makensis" || set "NSIS=%ProgramFiles(x86)%\NSIS\makensis.exe"
if not exist "%NSIS%" set "NSIS=%ProgramFiles%\NSIS\makensis.exe"
if not exist "%NSIS%" (
    echo  [JARVIS] NSIS nao encontrado. Copie o instalador manualmente:
    echo  [JARVIS]  1) Instale o NSIS: https://nsis.sourceforge.io/download
    echo  [JARVIS]  2) Depois rode:  makensis installer.nsi
    echo.
    echo  [JARVIS] O jarvis.exe ja foi gerado em dist\.
    pause
    exit /b 0
)

"%NSIS%" installer.nsi
if errorlevel 1 ( echo  [JARVIS] Falha no NSIS & pause & exit /b 1 )

echo.
echo  ============================================================
echo   PRONTO!
echo     Executavel:  dist\jarvis.exe
echo     Instalador:  dist\JARVIS-Setup.exe
echo  ============================================================
echo   Copie o JARVIS-Setup.exe para outro PC e de duplo clique
echo   para instalar (cria atalhos no Menu Iniciar e Desktop).
echo.
pause
endlocal
