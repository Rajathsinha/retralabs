const express = require('express');
const router = express.Router();
const { db, generateOrderId } = require('../db');

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COD_COLLECTED', 'CANCELLED'];

function getCodFee(subtotal) {
  return subtotal <= 5000 ? 500 : 1000;
}

const insertOrder = db.transaction((order, items) => {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO orders (id, created_at, updated_at, customer_name, customer_phone,
      customer_address, pincode, subtotal, delivery_charge, payment_method,
      cod_fee, total_amount, order_status, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING')
  `).run(
    order.id, now, now,
    order.customerName, order.customerPhone,
    order.customerAddress, order.pincode,
    order.subtotal, order.deliveryCharge,
    order.paymentMethod, order.codFee, order.totalAmount
  );

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_key, product_name, dosage_mg, quantity, unit_price, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of items) {
    insertItem.run(order.id, item.productKey, item.productName, item.dosage, item.quantity, item.price, item.price * item.quantity);
  }

  db.prepare(`
    INSERT INTO order_status_history (order_id, status, changed_at, changed_by)
    VALUES (?, 'PENDING', ?, 'system')
  `).run(order.id, now);
});

router.post('/', (req, res) => {
  const { customerName, customerPhone, customerAddress, pincode, items, deliveryCharge, subtotal, paymentMethod } = req.body;

  if (!customerName || !customerPhone || !customerAddress || !pincode || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (!/^\d{10}$/.test(customerPhone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number (must be 10 digits)' });
  }
  if (!/^\d{6}$/.test(pincode)) {
    return res.status(400).json({ success: false, message: 'Invalid pincode (must be 6 digits)' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }
  if (!['PREPAID', 'COD'].includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }

  const safeSubtotal = parseInt(subtotal, 10) || 0;
  const safeDelivery = parseInt(deliveryCharge, 10) || 2000;
  const codFee = paymentMethod === 'COD' ? getCodFee(safeSubtotal) : 0;
  const totalAmount = safeSubtotal + safeDelivery + codFee;

  try {
    const orderId = generateOrderId();
    insertOrder(
      { id: orderId, customerName: customerName.trim(), customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(), pincode: pincode.trim(),
        subtotal: safeSubtotal, deliveryCharge: safeDelivery,
        paymentMethod, codFee, totalAmount },
      items
    );
    res.json({ success: true, orderId, codFee, totalAmount });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

module.exports = router;
