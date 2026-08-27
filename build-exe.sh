#!/usr/bin/env bash
# ============================================================
#  J.A.R.V.I.S. - Gera o executavel JARVIS.exe (cross-build p/ Windows)
#  Requisito: Node.js instalado (https://nodejs.org) + internet
#  Uso: ./build-exe.sh   (Linux/macOS)
# ============================================================
set -e
cd "$(dirname "$0")"

echo ""
echo " [JARVIS] Verificando Node.js..."
if ! command -v node >/dev/null 2>&1; then
  echo " [JARVIS] Node.js nao encontrado. Instale em https://nodejs.org"
  exit 1
fi

echo " [JARVIS] Instalando ferramenta de build (pkg)..."
npm install

echo " [JARVIS] Gerando JARVIS.exe (pode demorar alguns minutos)..."
npx pkg . --targets node22-win-x64 --output dist/jarvis.exe

echo ""
echo " ============================================================"
echo "  PRONTO! O executavel foi criado em:"
echo "    $(pwd)/dist/jarvis.exe"
echo "  Copie esse arquivo para o Windows e de duplo clique."
echo " ============================================================"
