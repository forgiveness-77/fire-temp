const express = require('express');
const router = express.Router();
const store = require('../store');
const asyncHandler = require('../asyncHandler');
const { authorize } = require('../middleware/auth');
const { CAN_WRITE } = require('../roles');

router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  let customers = (await store.raw('customers')).sort((a, b) => b.id - a.id);

  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  }

  const result = await Promise.all(customers.map(async (c) => ({
    ...c,
    extinguisher_count: await store.count('extinguishers', { customer_id: c.id }),
  })));
  res.json(result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const c = await store.findById('customers', parseInt(req.params.id));
  if (!c) return res.status(404).json({ error: 'Customer not found' });
  res.json(c);
}));

router.post('/', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (await store.findOne('customers', { email })) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const customer = await store.insert('customers', { name, email, phone: phone || null, address: address || null });
  res.status(201).json(customer);
}));

router.put('/:id', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, phone, address } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const existing = await store.findOne('customers', { email });
  if (existing && existing.id !== id) return res.status(409).json({ error: 'Email already exists' });

  const updated = await store.update('customers', id, { name, email, phone: phone || null, address: address || null });
  res.json(updated);
}));

router.delete('/:id', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  await store.delete('customers', id);
  res.json({ message: 'Customer deleted' });
}));

module.exports = router;
