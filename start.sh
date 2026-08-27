#!/usr/bin/env bash
# ============================================================
#  J.A.R.V.I.S. - Inicia o assistente na sua máquina (Linux/Mac)
#  Requisito: Node.js instalado (nodejs.org)
# ============================================================
set -e
cd "$(dirname "$0")"

echo ""
echo " [JARVIS] Verificando Node.js..."
if ! command -v node >/dev/null 2>&1; then
  echo " [JARVIS] Node.js nao encontrado. Instale em https://nodejs.org"
  exit 1
fi

# Se não houver .env, cria a partir do exemplo.
if [ ! -f ".env" ]; then
  echo " [JARVIS] Criando .env a partir de .env.example"
  cp ".env.example" ".env"
fi

echo " [JARVIS] Iniciando servidor..."
echo " [JARVIS] Abra http://localhost:3000 no navegador"
echo ""
node server.js
