const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { createToken, requireAdmin, ADMIN_PASSWORD } = require('../middleware/adminAuth');
const crypto = require('crypto');

const VALID_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COD_COLLECTED', 'CANCELLED'];

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin panel not configured' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  const a = Buffer.from(crypto.createHash('sha256').update(password).digest('hex'));
  const b = Buffer.from(crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex'));
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  res.json({ token: createToken() });
});

router.get('/orders', requireAdmin, (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];
  if (status && VALID_ORDER_STATUSES.includes(status)) {
    query += ' WHERE order_status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json({ orders });
});

router.get('/orders/:id', requireAdmin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC').all(req.params.id);

  res.json({ order, items, history });
});

router.patch('/orders/:id/status', requireAdmin, (req, res) => {
  const { status, note } = req.body || {};
  if (!status || !VALID_ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);
  db.prepare('INSERT INTO order_status_history (order_id, status, changed_at, changed_by, note) VALUES (?, ?, ?, \'admin\', ?)').run(req.params.id, status, now, note || null);

  res.json({ success: true });
});

router.patch('/orders/:id/payment', requireAdmin, (req, res) => {
  const { paymentStatus } = req.body || {};
  const allowed = ['PENDING', 'RECEIVED', 'COLLECTED', 'FAILED'];
  if (!paymentStatus || !allowed.includes(paymentStatus)) {
    return res.status(400).json({ error: 'Invalid payment status' });
  }

  const order = db.prepare('SELECT id, order_status, payment_method FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (paymentStatus === 'COLLECTED' && order.payment_method !== 'COD') {
    return res.status(400).json({ error: 'COLLECTED status is only for COD orders' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run(paymentStatus, now, req.params.id);

  if (paymentStatus === 'COLLECTED') {
    db.prepare('UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?').run('COD_COLLECTED', now, req.params.id);
    db.prepare('INSERT INTO order_status_history (order_id, status, changed_at, changed_by, note) VALUES (?, \'COD_COLLECTED\', ?, \'admin\', ?)').run(req.params.id, now, 'COD payment collected');
  }

  res.json({ success: true });
});

router.patch('/orders/:id/notes', requireAdmin, (req, res) => {
  const { notes } = req.body || {};
  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  db.prepare('UPDATE orders SET admin_notes = ?, updated_at = ? WHERE id = ?').run(notes || null, new Date().toISOString(), req.params.id);
  res.json({ success: true });
});

module.exports = router;
