const express = require('express');
const router = express.Router();
const store = require('../store');
const asyncHandler = require('../asyncHandler');
const { authorize } = require('../middleware/auth');
const { CAN_WRITE } = require('../roles');

function daysLeft(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

async function enrich(e) {
  const c = await store.findById('customers', e.customer_id);
  return {
    ...e,
    customer_name: c?.name || 'Unknown',
    customer_email: c?.email || '',
    customer_phone: c?.phone || '',
  };
}

router.get('/stats', asyncHandler(async (req, res) => {
  const exts = await store.raw('extinguishers');

  const total = exts.length;
  const active = exts.filter((e) => e.status === 'active').length;
  const expired = exts.filter((e) => e.status === 'expired').length;
  const expiring30 = exts.filter((e) => e.status === 'active' && daysLeft(e.expiry_date) <= 30).length;
  const expiring7 = exts.filter((e) => e.status === 'active' && daysLeft(e.expiry_date) <= 7).length;
  const customers = (await store.raw('customers')).length;
  const escalations = (await store.raw('escalations')).filter((e) => e.status !== 'resolved').length;

  res.json({ total, active, expired, expiring30, expiring7, customers, escalations });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { customer_id, status, search } = req.query;
  let exts = await store.raw('extinguishers');

  if (customer_id) exts = exts.filter((e) => e.customer_id === parseInt(customer_id));
  if (status) exts = exts.filter((e) => e.status === status);
  if (search) {
    const q = search.toLowerCase();
    exts = await Promise.all(exts.map(async (e) => {
      const c = await store.findById('customers', e.customer_id);
      return { e, c };
    }));
    exts = exts
      .filter(({ e, c }) =>
        e.serial_number?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        c?.name?.toLowerCase().includes(q)
      )
      .map(({ e }) => e);
  }

  exts.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  res.json(await Promise.all(exts.map(enrich)));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const e = await store.findById('extinguishers', parseInt(req.params.id));
  if (!e) return res.status(404).json({ error: 'Not found' });
  res.json(await enrich(e));
}));

router.post('/', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const { customer_id, serial_number, type, location, purchase_date, expiry_date } = req.body;
  if (!customer_id || !type || !purchase_date || !expiry_date) {
    return res.status(400).json({ error: 'customer_id, type, purchase_date, expiry_date are required' });
  }

  const ext = await store.insert('extinguishers', {
    customer_id: parseInt(customer_id),
    serial_number: serial_number || null,
    type,
    location: location || null,
    purchase_date,
    expiry_date,
    status: 'active',
  });
  res.status(201).json(await enrich(ext));
}));

router.put('/:id', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { customer_id, serial_number, type, location, purchase_date, expiry_date, status } = req.body;
  if (!customer_id || !type || !purchase_date || !expiry_date) {
    return res.status(400).json({ error: 'customer_id, type, purchase_date, expiry_date are required' });
  }

  const updated = await store.update('extinguishers', id, {
    customer_id: parseInt(customer_id),
    serial_number: serial_number || null,
    type,
    location: location || null,
    purchase_date,
    expiry_date,
    status: status || 'active',
  });
  res.json(await enrich(updated));
}));

router.delete('/:id', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  await store.delete('extinguishers', parseInt(req.params.id));
  res.json({ message: 'Deleted' });
}));

module.exports = router;
