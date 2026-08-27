#!/usr/bin/env bash
# ============================================================
#  J.A.R.V.I.S. - Build completo (Linux/macOS -> Windows)
#  Gera o jarvis.exe e o instalador JARVIS-Setup.exe
#  Requisitos: Node.js 18+, internet, e NSIS (para o instalador)
# ============================================================
set -e
cd "$(dirname "$0")"

echo ""
echo " [1/4] Verificando Node.js..."
if ! command -v node >/dev/null 2>&1; then
  echo " [JARVIS] Node.js nao encontrado. Instale em https://nodejs.org"
  exit 1
fi

echo " [2/4] Instalando dependencias (pkg + rcedit)..."
npm install --no-save pkg rcedit

echo " [3/5] Gerando jarvis.exe (pode demorar alguns minutos na 1a vez)..."
npx pkg . --targets node22-win-x64 --output dist/jarvis.exe \
  || npx pkg . --targets node18-win-x64 --output dist/jarvis.exe
[ -f dist/jarvis.exe ] || { echo " [JARVIS] Nao foi possivel gerar o exe"; exit 1; }

echo " [4/5] Aplicando icone no jarvis.exe..."
npx rcedit dist/jarvis.exe --set-icon assets/icon.ico 2>/dev/null \
  || echo " [JARVIS] Aviso: nao foi possivel aplicar o icone (seguindo sem)."

echo " [5/5] Compilando instalador (NSIS)..."
if command -v makensis >/dev/null 2>&1; then
  makensis installer.nsi
elif [ -x "/Applications/NSIS/makensis" ]; then
  "/Applications/NSIS/makensis" installer.nsi
else
  echo ""
  echo " [JARVIS] NSIS nao encontrado. O jarvis.exe ja foi gerado em dist/."
  echo " [JARVIS] Para o instalador, instale o NSIS: https://nsis.sourceforge.io/download"
  echo " [JARVIS] Depois rode:  makensis installer.nsi"
  exit 0
fi

echo ""
echo " ============================================================"
echo "  PRONTO!"
echo "    Executavel:  dist/jarvis.exe"
echo "    Instalador:  dist/JARVIS-Setup.exe"
echo " ============================================================"
