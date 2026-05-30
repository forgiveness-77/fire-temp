const bcrypt = require('bcryptjs');
const store = require('./store');

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', name: 'System Admin', role: 'admin', email: 'admin@fems.local' },
  { username: 'manager', password: 'manager123', name: 'Operations Manager', role: 'manager', email: 'manager@fems.local' },
  { username: 'viewer', password: 'viewer123', name: 'Read Only User', role: 'viewer', email: 'viewer@fems.local' },
];

async function seedUsers() {
  if (!(await store.isEmpty('users'))) return;

  for (const u of DEFAULT_USERS) {
    await store.insert('users', {
      username: u.username,
      password_hash: bcrypt.hashSync(u.password, 10),
      name: u.name,
      role: u.role,
      email: u.email,
      is_active: 1,
    });
  }
  console.log('Seeded default users (admin/admin123, manager/manager123, viewer/viewer123)');
}

module.exports = { seedUsers };
