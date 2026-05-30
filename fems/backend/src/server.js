require('./loadEnv');
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const { startScheduler } = require('./scheduler');
const { seedUsers } = require('./seed');
const { migrateFromJsonIfEmpty } = require('./migrate');
const { authenticate, authorize } = require('./middleware/auth');
const { ROLES } = require('./roles');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', authenticate, authorize(ROLES.ADMIN), require('./routes/users'));

app.use('/api/customers', authenticate, require('./routes/customers'));
app.use('/api/extinguishers', authenticate, require('./routes/extinguishers'));
app.use('/api/notifications', authenticate, require('./routes/notifications'));
app.use('/api/escalations', authenticate, require('./routes/escalations'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await initDb();
  await migrateFromJsonIfEmpty();
  await seedUsers();

  app.listen(PORT, () => {
    console.log(`FEMS Backend running on http://localhost:${PORT}`);
    startScheduler();
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
