# J.A.R.V.I.S.

Assistente pessoal com **voz** e **IA**, inspirado no JARVIS do Homem de Ferro.

> ✨ **Quer um `.exe`?</strong> [Veja "Gerar o JARVIS.exe"](#gerar-o-jarvisexe)

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

## Rodando localmente (IA completa, garantida)

1. Instale o [Node.js](https://nodejs.org) (18+).
2. Crie o arquivo `.env` (ou deixe o script criar a partir de `.env.example`)
   e cole sua chave:
   ```env
   GROQ_API_KEY=gsk_...
   ```
3. Inicie:

   **Windows** (duplo clique):
   ```bat
   start.bat
   ```
   **Linux / macOS**:
   ```bash
   ./start.sh
   ```
   Ou manualmente:
   ```bash
   npm start
   ```
4. Abra `http://localhost:3000`.

> ✅ Na sua máquina o servidor tem internet, então use **Rota da IA = "Pelo servidor"**
> (ou "Auto") — funciona garantido.

## Instalação em 3 opções

Você pode usar o JARVIS de 3 formas (veja o arquivo **`INSTALAR.txt`**):

1. **Sem instalar nada** — abra o arquivo **`JARVIS.html`** (duplo clique).
   Funciona direto no navegador, basta colocar sua API key na engrenagem.
2. **Gerar o `jarvis.exe`** — rode **`build-exe.bat`** (na sua máquina).
   Ele cria um `.exe` que abre sozinho (embute o Node, não precisa instalar
   nada no PC).
3. **Rodar com Node** — **`start.bat`** ou `npm start`, abra `localhost:3000`.

> O pacote de download inclui `JARVIS.html`, `build-exe.bat`, `start.bat` e
> o código-fonte completo.

## Gerar o JARVIS.exe

<details>
<summary>Como gerar (clique para expandir)</summary>

O JARVIS pode virar um **único arquivo `.exe`** (Windows) que embute o Node.js
e o site — o computador não precisa instalar nada, é só dar duplo clique.

**Passos (na sua máquina, com internet):**

1. Instale o [Node.js](https://nodejs.org) (18+).
2. Abra o **Prompt de Comando (cmd)** ou o **PowerShell** na pasta do projeto.
3. Rode:

   - **Windows:** dê duplo clique em `build-exe.bat`
   - **Linux/macOS:** `./build-exe.sh`

   (Ou manualmente: `npm install` e depois `npx pkg . --targets node22-win-x64 --output dist\jarvis.exe`)

4. O arquivo será criado em **`dist\jarvis.exe`**.
5. Copie o `jarvis.exe` para qualquer pasta e **dê duplo clique** — ele abre
   o seu navegador automaticamente.

> ⚠️ O `.exe` gerado **não** contém sua API key. Ao abrir, você configura a
> Groq na **engrenagem** (Rota da IA = "Pelo servidor") — a chave fica salva
> no navegador.

> 💡 O exe serve a partir de `localhost`, então o modo de IA "Pelo servidor"
> já é selecionado automaticamente (o servidor embutido tem internet e fala
> com a Groq sem atravessar terceiros).
</details>

## Rodando no preview (Arena) — sem servidor com internet

O sandbox do preview **não tem internet**, então a IA precisa ser chamada pelo
**seu navegador**. Por isso a rota padrão do preview é **"Via proxy CORS"**
(disponível no seletor "Rota da IA" nas configurações).

> ⚠️ No modo proxy CORS, a API key trafega por um serviço público de terceiro.
> **Não recomendo** para uso sério — nesse caso, rode localmente.

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
