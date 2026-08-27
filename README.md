# J.A.R.V.I.S.

Assistente pessoal com **voz** e **IA**, inspirado no JARVIS do Homem de Ferro.

- 🎤 Fale com o assistente (reconhecimento de voz via navegador)
- 🔊 Respostas faladas (síntese de voz)
- 🧠 Inteligência real via **OpenAI API** (streaming em tempo real)
- 🖥️ Interface estilo HUD / arc reactor
- ⌨️ Também funciona digitando (fallback para navegadores sem voz)

## Como funciona

- `server.js` — servidor Node (sem dependências) que entrega o frontend e faz
  o proxy das chamadas para a OpenAI com **streaming** (Server-Sent Events).
- `public/` — frontend (HTML/CSS/JS puro).

## Rodando

```bash
npm start
# ou
node server.js
```

Abra `http://localhost:3000`. (No preview do Arena, o endereço é mostrado
automaticamente.)

## Provedores de IA: Groq (padrão) e OpenAI

O JARVIS usa a **Groq** por padrão (rápida e gratuita). Também suporta OpenAI.
A chave pode ser configurada de duas formas:

1. **`.env` (recomendado, seguro)** — crie um arquivo `.env` na raiz:

   ```env
   GROQ_API_KEY=gsk_...
   # OPENAI_API_KEY=sk-...
   ```

   > O `.env` já está no `.gitignore` — **nunca** versione sua chave no git.

2. **No navegador** — clique na **engrenagem** (canto superior direito), escolha
   o provedor, cole a API key e clique em **Salvar**.

### Modelos sugeridos (Groq)

- `openai/gpt-oss-120b` — mais inteligente (padrão)
- `openai/gpt-oss-20b` — mais rápido
- `qwen/qwen3.6-27b`
- `meta-llama/llama-4-scout-17b-16e-instruct`

> ⚠️ Os modelos `llama-3.1-8b-instant` e `llama-3.3-70b-versatile` foram
> descontinuados pela Groq em 16/08/2026 — prefira os listados acima.

> 🔐 A API key fica salva apenas no seu navegador (localStorage) e é enviada
> pelo servidor, que faz a ponte para o provedor. Por ser uma chave pessoal,
> **não** compartilhe o link público com alguém que não seja você.

> 🌐 **Nota:** o sandbox de preview deste repo não tem acesso à internet, então
> as respostas de IA só funcionam quando você rodar o JARVIS em um ambiente
> com rede (ex.: sua máquina, com `npm start`).

## Comandos locais (não precisam de IA)

- “Que horas são?” → informa a hora
- “Que dia é hoje?” → informa a data
- “Abrir Google” → abre o Google
- “Limpar conversa” → limpa o chat

Todo o resto é respondido pela IA.

## Requisitos

- Node.js 18+
- Browser moderno (Chrome/Edge recomendado para reconhecimento de voz)
- Uma OpenAI API key
