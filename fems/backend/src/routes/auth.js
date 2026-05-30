const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const store = require('../store');
const asyncHandler = require('../asyncHandler');
const { signToken, authenticate, sanitizeUser } = require('../middleware/auth');
const { ROLES } = require('../roles');

router.post('/register', asyncHandler(async (req, res) => {
  const { username, password, name, email } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores' });
  }

  if (await store.findOne('users', { username })) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const user = await store.insert('users', {
    username,
    password_hash: bcrypt.hashSync(password, 10),
    name,
    email: email || null,
    role: ROLES.VIEWER,
    is_active: 1,
  });

  const token = signToken(user);
  res.status(201).json({ token, user: sanitizeUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = await store.findOne('users', { username });
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await store.findById('users', req.user.id);
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'User not found or inactive' });
  }
  res.json(sanitizeUser(user));
}));

module.exports = router;
