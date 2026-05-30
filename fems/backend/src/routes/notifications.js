const express = require('express');
const router = express.Router();
const store = require('../store');
const asyncHandler = require('../asyncHandler');
const { authorize } = require('../middleware/auth');
const { CAN_WRITE } = require('../roles');

async function enrich(n) {
  const c = await store.findById('customers', n.customer_id);
  const e = await store.findById('extinguishers', n.extinguisher_id);
  return {
    ...n,
    customer_name: c?.name || 'Unknown',
    customer_email: c?.email || '',
    serial_number: e?.serial_number || null,
    extinguisher_type: e?.type || '',
    location: e?.location || '',
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const { customer_id, is_seen } = req.query;
  let notifs = await store.raw('notifications');

  if (customer_id) notifs = notifs.filter((n) => n.customer_id === parseInt(customer_id));
  if (is_seen !== undefined) notifs = notifs.filter((n) => n.is_seen === parseInt(is_seen));

  notifs.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
  res.json(await Promise.all(notifs.map(enrich)));
}));

router.patch('/:id/seen', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  await store.update('notifications', id, {
    is_seen: 1,
    seen_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });
  res.json({ message: 'Marked as seen' });
}));

router.patch('/seen-all', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const { customer_id } = req.body;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const notifs = await store.raw('notifications');
  for (const n of notifs) {
    if (n.is_seen === 0 && (!customer_id || n.customer_id === parseInt(customer_id))) {
      await store.update('notifications', n.id, { is_seen: 1, seen_at: now });
    }
  }
  res.json({ message: 'All marked as seen' });
}));

router.post('/trigger-check', authorize(...CAN_WRITE), asyncHandler(async (req, res) => {
  const { checkExpirations } = require('../scheduler');
  await checkExpirations();
  res.json({ message: 'Expiration check triggered' });
}));

module.exports = router;
