// Aplica o ícone ao executável Windows (jarvis.exe) usando a biblioteca rcedit.
// Uso: node set-icon.js <caminho-do-exe> [caminho-do-ico]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rcedit } from 'rcedit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exe = process.argv[2] || path.join(__dirname, 'dist', 'jarvis.exe');
const icon = process.argv[3] || path.join(__dirname, 'assets', 'icon.ico');

try {
  await rcedit(exe, { icon });
  console.log(`Icone aplicado: ${exe}`);
} catch (err) {
  console.error(`Nao foi possivel aplicar o icone: ${err.message}`);
  console.error('(No Windows isso funciona nativamente; em Linux/Mac requer Wine.)');
  process.exit(0); // não falha o build por causa do ícone
}
