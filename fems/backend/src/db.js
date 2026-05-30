require('./loadEnv');
const { Pool } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fems',
};

if (!config.password) {
  throw new Error('DB_PASSWORD is required. Set it in fems/backend/.env');
}

let pool;

function getPool() {
  if (!pool) pool = new Pool(config);
  return pool;
}

async function ensureDatabase() {
  const admin = new Pool({ ...config, database: 'postgres' });
  try {
    const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.database]);
    if (rows.length === 0) {
      await admin.query(`CREATE DATABASE ${config.database}`);
      console.log(`Created database "${config.database}"`);
    }
  } finally {
    await admin.end();
  }
}

async function initSchema() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        is_active SMALLINT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS extinguishers (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        serial_number VARCHAR(100),
        type VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        purchase_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        extinguisher_id INTEGER NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_seen SMALLINT NOT NULL DEFAULT 0,
        sent_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        seen_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS escalations (
        id SERIAL PRIMARY KEY,
        extinguisher_id INTEGER NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        escalated_at TIMESTAMP,
        resolved_at TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}

async function initDb() {
  try {
    await ensureDatabase();
  } catch (err) {
    console.warn('Could not auto-create database (connect manually if needed):', err.message);
  }
  await initSchema();
  console.log(`Connected to PostgreSQL database "${config.database}"`);
}

module.exports = { getPool, initDb, config };
