const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'imobiliwin',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASS     || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado:', err);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('[DB] ❌ Falha ao conectar:', err.message);
  } else {
    console.log('[DB] ✅ PostgreSQL conectado!');
    release();
  }
});

module.exports = pool;