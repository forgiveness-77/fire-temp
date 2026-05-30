const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const store = require('../store');
const asyncHandler = require('../asyncHandler');
const { sanitizeUser, ALL_ROLES } = require('../middleware/auth');

router.get('/', asyncHandler(async (req, res) => {
  const users = (await store.raw('users')).sort((a, b) => b.id - a.id);
  res.json(users.map(sanitizeUser));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await store.findById('users', parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(sanitizeUser(user));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { username, password, name, email, role } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'username, password, name, and role are required' });
  }
  if (!ALL_ROLES.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${ALL_ROLES.join(', ')}` });
  }
  if (await store.findOne('users', { username })) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const user = await store.insert('users', {
    username,
    password_hash: bcrypt.hashSync(password, 10),
    name,
    email: email || null,
    role,
    is_active: 1,
  });
  res.status(201).json(sanitizeUser(user));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, password, name, email, role, is_active } = req.body;
  const existing = await store.findById('users', id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  if (username) {
    const conflict = await store.findOne('users', { username });
    if (conflict && conflict.id !== id) {
      return res.status(409).json({ error: 'Username already exists' });
    }
  }
  if (role && !ALL_ROLES.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${ALL_ROLES.join(', ')}` });
  }

  const changes = {};
  if (username !== undefined) changes.username = username;
  if (name !== undefined) changes.name = name;
  if (email !== undefined) changes.email = email || null;
  if (role !== undefined) changes.role = role;
  if (is_active !== undefined) changes.is_active = is_active ? 1 : 0;
  if (password) changes.password_hash = bcrypt.hashSync(password, 10);

  const updated = await store.update('users', id, changes);
  res.json(sanitizeUser(updated));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  if (!(await store.delete('users', id))) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ message: 'User deleted' });
}));

module.exports = router;
