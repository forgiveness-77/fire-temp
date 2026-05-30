const cron = require('node-cron');
const store = require('./store');

function todayStr() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function daysLeft(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function createNotificationIfNew(ext, type, message) {
  const today = todayDate();
  const notifications = await store.findAll('notifications', { extinguisher_id: ext.id, type });
  const exists = notifications.some((n) => n.sent_at?.startsWith(today));
  if (!exists) {
    await store.insert('notifications', {
      extinguisher_id: ext.id,
      customer_id: ext.customer_id,
      message,
      type,
      is_seen: 0,
      sent_at: todayStr(),
    });
  }
}

async function checkExpirations() {
  const extinguishers = await store.findAll('extinguishers', { status: 'active' });

  for (const ext of extinguishers) {
    const days = daysLeft(ext.expiry_date);
    const sn = ext.serial_number || `#${ext.id}`;
    const loc = ext.location || 'your location';

    if (days <= 0) {
      await store.update('extinguishers', ext.id, { status: 'expired' });
      await createNotificationIfNew(ext, 'expired',
        `EXPIRED: Fire extinguisher (S/N: ${sn}) at ${loc} has expired. Replace immediately to comply with fire safety regulations.`);

      const unseenCount = await store.count('notifications', { extinguisher_id: ext.id, is_seen: 0 });
      const alreadyEscalated = await store.findOne('escalations', { extinguisher_id: ext.id });

      if (unseenCount >= 3 && !alreadyEscalated) {
        const c = await store.findById('customers', ext.customer_id);
        await store.insert('escalations', {
          extinguisher_id: ext.id,
          customer_id: ext.customer_id,
          reason: `Customer ${c?.name || 'Unknown'} has not responded to ${unseenCount} notifications regarding expired extinguisher (S/N: ${sn}) at ${loc}.`,
          status: 'pending',
        });
        console.log(`[Scheduler] Escalation created for extinguisher ${ext.id}`);
      }

    } else if (days <= 7) {
      await createNotificationIfNew(ext, '7_days',
        `URGENT: Fire extinguisher (S/N: ${sn}) at ${loc} expires in ${days} day(s). Renew immediately.`);
    } else if (days <= 30) {
      await createNotificationIfNew(ext, '30_days',
        `Reminder: Fire extinguisher (S/N: ${sn}) at ${loc} will expire in ${days} day(s). Please schedule renewal.`);
    }
  }

  console.log(`[Scheduler] Expiration check done at ${todayStr()}`);
}

function startScheduler() {
  cron.schedule('0 8 * * *', () => checkExpirations().catch(console.error));
  checkExpirations().catch(console.error);
  console.log('[Scheduler] Started — runs daily at 08:00');
}

module.exports = { startScheduler, checkExpirations };
