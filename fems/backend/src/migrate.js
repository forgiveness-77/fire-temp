const fs = require('fs');
const path = require('path');
const store = require('./store');

const DATA_FILE = path.join(__dirname, '../data.json');

async function resetSequence(table) {
  const { getPool } = require('./db');
  await getPool().query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`,
    [table]
  );
}

async function migrateTable(table, rows) {
  if (!rows?.length || !(await store.isEmpty(table))) return;
  for (const row of rows) {
    await store.insertWithId(table, row);
  }
  await resetSequence(table);
  console.log(`Migrated ${rows.length} ${table} from data.json`);
}

async function migrateFromJsonIfEmpty() {
  if (!fs.existsSync(DATA_FILE)) return;

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log('Checking data.json for PostgreSQL migration...');

  await migrateTable('customers', data.customers);
  await migrateTable('users', data.users);
  await migrateTable('extinguishers', data.extinguishers);
  await migrateTable('notifications', data.notifications);
  await migrateTable('escalations', data.escalations);
}

module.exports = { migrateFromJsonIfEmpty };
