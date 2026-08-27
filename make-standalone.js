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

// Injeta o estilo logo após a abertura de <head>
html = html.replace(/<head>/i, `<head>\n${styleTag}`);
// Injeta o script imediatamente antes de </body> (preserva a ordem original do app)
html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);

fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'JARVIS.html'), html, 'utf8');
console.log('dist/JARVIS.html gerado com sucesso.');
