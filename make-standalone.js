// Gera um único arquivo "JARVIS.html" autossuficiente (CSS+JS embutidos).
// Assim o usuário pode dar duplo clique e usar sem instalar Node/servidor.
// A rota de IA padrão no standalone é "proxy" (navegador -> CORS proxy).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(__dirname, 'public');

function read(name) {
  return fs.readFileSync(path.join(pub, name), 'utf8');
}

let html = read('index.html');
const css = read('styles.css');
let js = read('app.js');

// Remove o <link rel="stylesheet" href="/styles.css" /> (não funciona via file://)
html = html.replace(/\s*<link rel="stylesheet" href="\/styles\.css"\s*\/?>\s*/i, '');
// Remove o <script src="/app.js"></script>
html = html.replace(/\s*<script src="\/app\.js"><\/script>\s*/i, '');

// Pré-configuração: no standalone não há servidor, então forçamos o modo "proxy"
// por padrão (mantendo o que o usuário já salvou).
const proxyDefault = `
<script>
  // standalone: sem servidor -> rota padrão via proxy CORS
  try {
    if (!localStorage.getItem('jarvis_connectionMode')) {
      localStorage.setItem('jarvis_connectionMode', 'proxy');
    }
  } catch (e) {}
</script>`;

const styleTag = `<style>\n${css}\n</style>`;
const scriptTag = proxyDefault + `\n<script>\n${js}\n</script>`;

const FAVICON_LINK = '<link rel="icon" type="image/png" href="data:image/png;base64,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" />';

// Injeta o estilo logo após a abertura de <head>
html = html.replace(/<head>/i, `<head>\n${FAVICON_LINK}\n${styleTag}`);
// Injeta o script imediatamente antes de </body> (preserva a ordem original do app)
html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'JARVIS.html'), html, 'utf8');
console.log('dist/JARVIS.html gerado com sucesso.');
