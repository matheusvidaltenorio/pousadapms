/**
 * Aplica migrações Prisma com suporte a Supabase pooler.
 * Quando DATABASE_URL usa porta 6543 (pooler), converte automaticamente
 * para DIRECT_URL com porta 5432 (session mode), necessário para migrate deploy.
 */
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '../.env');
try {
  require('dotenv').config({ path: envPath });
} catch {
  // Fallback: carrega .env manualmente
  try {
    const fs = require('fs');
    if (fs.existsSync(envPath)) {
      fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      });
    }
  } catch (_) {}
}

const dbUrl = process.env.DATABASE_URL;
let directUrl = process.env.DIRECT_URL;

if (!directUrl && dbUrl) {
  if (dbUrl.includes(':6543')) {
    // Supabase pooler: usar session mode (porta 5432) para migrações
    directUrl = dbUrl.replace(':6543', ':5432').replace(/[?&]pgbouncer=true&?/g, '');
    if (directUrl.endsWith('?')) directUrl = directUrl.slice(0, -1);
    process.env.DIRECT_URL = directUrl;
    console.log('DIRECT_URL configurada automaticamente (porta 5432) para migrate deploy');
  } else {
    process.env.DIRECT_URL = dbUrl;
  }
}

execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: process.env,
});
