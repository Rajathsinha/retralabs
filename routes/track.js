const express = require('express');
const router = express.Router();
const { db } = require('../db');

const ORDER_ID_RE = /^RL-\d{8}-[0-9A-F]{4}$/;

router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;

  if (!ORDER_ID_RE.test(orderId)) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  const history = db.prepare('SELECT status, changed_at, note FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC').all(orderId);

  res.json({
    orderId: order.id,
    createdAt: order.created_at,
    orderStatus: order.order_status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    customerName: order.customer_name,
    subtotal: order.subtotal,
    deliveryCharge: order.delivery_charge,
    codFee: order.cod_fee,
    totalAmount: order.total_amount,
    items: items.map(i => ({
      productName: i.product_name,
      dosageMg: i.dosage_mg,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      lineTotal: i.line_total,
    })),
    statusHistory: history,
  });
});

module.exports = router;
