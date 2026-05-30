const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const store = require('../store');
const asyncHandler = require('../asyncHandler');
const { signToken, authenticate, sanitizeUser } = require('../middleware/auth');

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
