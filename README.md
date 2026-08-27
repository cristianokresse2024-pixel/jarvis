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

## Configurando a OpenAI

1. Clique na **engrenagem** (canto superior direito).
2. Cole sua **OpenAI API key** (crie em https://platform.openai.com).
3. Escolha o **modelo** (padrão: `gpt-4o-mini`).
4. Selecione a **voz** do JARVIS e clique em **Salvar**.

> 🔐 A API key fica salva apenas no seu navegador (localStorage) e é enviada
> pelo servidor direto à OpenAI. Por ser uma chave pessoal, **não** compartilhe
> o link público de alguém que não seja você.

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
