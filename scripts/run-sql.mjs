// Ejecuta un archivo .sql directo contra la base de Supabase (conexión de
// Postgres, no la API REST) para no depender de copiar/pegar en el SQL
// Editor del dashboard. Uso: node scripts/run-sql.mjs <archivo.sql>
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/run-sql.mjs <archivo.sql>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(file), 'utf8');

const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });

try {
  await client.connect();
  await client.query(sql);
  console.log(`OK: ${file} ejecutado correctamente.`);
} catch (err) {
  console.error('ERROR ejecutando la migración:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
