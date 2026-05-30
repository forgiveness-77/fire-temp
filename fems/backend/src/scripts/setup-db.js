require('../loadEnv');
const { initDb } = require('../db');
const { migrateFromJsonIfEmpty } = require('../migrate');
const { seedUsers } = require('../seed');

async function main() {
  await initDb();
  await migrateFromJsonIfEmpty();
  await seedUsers();
  console.log('Database setup complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
