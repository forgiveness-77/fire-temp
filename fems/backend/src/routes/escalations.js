const express = require('express');
const router = express.Router();
const store = require('../store');
const asyncHandler = require('../asyncHandler');
const { authorize } = require('../middleware/auth');
const { CAN_WRITE } = require('../roles');

async function enrich(es) {
  const c = await store.findById('customers', es.customer_id);
  const e = await store.findById('extinguishers', es.extinguisher_id);
  return {
    ...es,
    customer_name: c?.name || 'Unknown',
    customer_email: c?.email || '',
    customer_phone: c?.phone || '',
    serial_number: e?.serial_number || null,
    extinguisher_type: e?.type || '',
    location: e?.location || '',
    expiry_date: e?.expiry_date || '',
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  let escs = await store.raw('escalations');
  if (status) escs = escs.filter((e) => e.status === status);
  escs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(await Promise.all(escs.map(enrich)));
}));

router.patch('/:id/status', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, notes } = req.body;
  const allowed = ['pending', 'escalated', 'resolved'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const changes = { status, notes: notes || null };
  if (status === 'escalated') changes.escalated_at = now;
  if (status === 'resolved') changes.resolved_at = now;

  await store.update('escalations', id, changes);
  res.json({ message: 'Status updated' });
}));

router.delete('/:id', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  await store.delete('escalations', parseInt(req.params.id));
  res.json({ message: 'Deleted' });
}));

module.exports = router;
