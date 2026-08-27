@echo off
REM ============================================================
REM  J.A.R.V.I.S. - INSTALADOR AUTOMATICO
REM  Faz tudo sozinho: baixa Node + NSIS, monta o JARVIS.exe,
REM  cria o instalador e um atalho no Desktop.
REM  Basta dar DUPLO CLIQUE neste arquivo.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"
title JARVIS - Instalacao automatica

set "TOOLS=%~dp0tools"
set "NODE_DIR=%TOOLS%\node"
set "NSIS_DIR=%TOOLS%\nsis"
set "NODE_VER=v22.11.0"

echo.
echo  ============================================================
echo   J.A.R.V.I.S. - Instalacao automatica
echo   Isto baixa e configura tudo sozinho.
echo   Pode demorar alguns minutos na primeira vez.
echo  ============================================================
echo.

REM ---------------- 1) Node.js ----------------
set "NODE_BIN=node"
where node >nul 2>&1
if not errorlevel 1 (
  echo  [OK] Node.js ja existe no sistema.
) else if exist "%NODE_DIR%\node.exe" (
  echo  [OK] Node.js portatil ja baixado.
  set "NODE_BIN=%NODE_DIR%\node.exe"
) else (
  echo  [..] Baixando Node.js portatil (%NODE_VER%)...
  if not exist "%TOOLS%" mkdir "%TOOLS%"
  curl -L --silent --show-error -o "%TOOLS%\node.zip" "https://nodejs.org/dist/%NODE_VER%/node-%NODE_VER%-win-x64.zip"
  if errorlevel 1 (
    echo  [ERRO] Nao foi possivel baixar o Node.js.
    echo         Verifique sua conexao com a internet.
    pause & exit /b 1
  )
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force '%TOOLS%\node.zip' '%TOOLS%'"
  move "%TOOLS%\node-%NODE_VER%-win-x64" "%NODE_DIR%" >nul 2>nul
  if not exist "%NODE_DIR%\node.exe" (
    echo  [ERRO] Falha ao extrair o Node.js.
    pause & exit /b 1
  )
  set "NODE_BIN=%NODE_DIR%\node.exe"
)
set "PATH=%NODE_DIR%;%PATH%"
echo  Node: %NODE_BIN%
"%NODE_BIN%" -v >nul 2>&1
if errorlevel 1 ( echo  [ERRO] Node.js nao esta funcional. & pause & exit /b 1 )

REM ---------------- 2) Dependencias do build ----------------
echo.
echo  [..] Preparando ferramentas de build (1a vez mais lenta)...
call "%NODE_BIN%" "%APPDATA%\npm\node_modules\npm\bin\npm-cli.js" install --no-save pkg rcedit 2>nul
if errorlevel 1 call "%NODE_BIN%" "npm" install --no-save pkg rcedit

REM ---------------- 3) Gerar jarvis.exe ----------------
echo.
echo  [..] Gerando JARVIS.exe...
call "%NODE_BIN%" "node_modules\pkg\lib-es5\bin.js" . --targets node22-win-x64 --output "%~dp0dist\jarvis.exe"
if not exist "%~dp0dist\jarvis.exe" (
  call "%NODE_BIN%" "node_modules\pkg\lib-es5\bin.js" . --targets node18-win-x64 --output "%~dp0dist\jarvis.exe"
)
if not exist "%~dp0dist\jarvis.exe" (
  echo  [ERRO] Nao foi possivel gerar o JARVIS.exe.
  echo         Voce pode usar o JARVIS.html (duplo clique) enquanto isso.
  pause & exit /b 1
)
echo  [OK] JARVIS.exe criado.

REM ---------------- 4) Aplicar icone ----------------
echo  [..] Aplicando icone...
call "%NODE_BIN%" "node_modules\rcedit\bin\rcedit.js" "%~dp0dist\jarvis.exe" --set-icon "%~dp0assets\icon.ico" 2>nul

REM ---------------- 5) NSIS (instalador) ----------------
set "NSIS_MAKENSIS="
where makensis >nul 2>&1 && set "NSIS_MAKENSIS=makensis"
if not defined NSIS_MAKENSIS if exist "%NSIS_DIR%\makensis.exe" set "NSIS_MAKENSIS=%NSIS_DIR%\makensis.exe"
if not defined NSIS_MAKENSIS if exist "%ProgramFiles(x86)%\NSIS\makensis.exe" set "NSIS_MAKENSIS=%ProgramFiles(x86)%\NSIS\makensis.exe"
if not defined NSIS_MAKENSIS if exist "%ProgramFiles%\NSIS\makensis.exe" set "NSIS_MAKENSIS=%ProgramFiles%\NSIS\makensis.exe"

if not defined NSIS_MAKENSIS (
  echo  [..] Baixando NSIS (compilador do instalador)...
  if not exist "%TOOLS%" mkdir "%TOOLS%"
  curl -L --silent --show-error -o "%TOOLS%\nsis.zip" "https://sourceforge.net/projects/nsis/files/NSIS%203/3.11/nsis-3.11.zip/download"
  if errorlevel 1 (
    echo  [AVISO] NSIS nao baixou. O JARVIS.exe foi criado sem instalador.
    echo          Voce pode usar o jarvis.exe direto ou o JARVIS.html.
    goto :atalho
  )
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force '%TOOLS%\nsis.zip' '%TOOLS%'"
  if exist "%TOOLS%\nsis-3.11" set "NSIS_MAKENSIS=%TOOLS%\nsis-3.11\makensis.exe"
)
if defined NSIS_MAKENSIS (
  echo  [..] Compilando o instalador (JARVIS-Setup.exe)...
  "%NSIS_MAKENSIS%" "%~dp0installer.nsi" >nul 2>&1
  if exist "%~dp0dist\JARVIS-Setup.exe" (
    echo  [OK] Instalador criado em dist\JARVIS-Setup.exe
  ) else (
    echo  [AVISO] Instalador nao compilado. Use o jarvis.exe direto.
  )
) else (
  echo  [AVISO] NSIS indisponivel. Use o jarvis.exe direto ou o JARVIS.html.
)

:atalho
REM ---------------- 6) Atalho no Desktop ----------------
echo  [..] Criando atalho no Desktop...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\JARVIS.lnk'); $s.TargetPath = '%~dp0dist\jarvis.exe'; $s.WorkingDirectory = '%~dp0dist'; $s.IconLocation = '%~dp0dist\jarvis.exe,0'; $s.Save()" 2>nul

echo.
echo  ============================================================
echo   PRONTO!
echo     Executavel:  dist\jarvis.exe
echo     Instalador:  dist\JARVIS-Setup.exe  (se NSIS baixou)
echo     Atalho:      JARVIS.lnk no Desktop
echo  ============================================================
echo.
echo   Para usar AGORA sem instalar: abra o arquivo  JARVIS.html
echo   (duplo clique) e cole sua chave Groq na engrenagem.
echo.
pause
endlocal
