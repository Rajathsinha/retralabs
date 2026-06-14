const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'retralabs.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    customer_name   TEXT NOT NULL,
    customer_phone  TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    pincode         TEXT NOT NULL,
    subtotal        INTEGER NOT NULL,
    delivery_charge INTEGER NOT NULL DEFAULT 2000,
    payment_method  TEXT NOT NULL,
    cod_fee         INTEGER NOT NULL DEFAULT 0,
    total_amount    INTEGER NOT NULL,
    order_status    TEXT NOT NULL DEFAULT 'PENDING',
    payment_status  TEXT NOT NULL DEFAULT 'PENDING',
    admin_notes     TEXT
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     TEXT NOT NULL REFERENCES orders(id),
    product_key  TEXT NOT NULL,
    product_name TEXT NOT NULL,
    dosage_mg    INTEGER NOT NULL,
    quantity     INTEGER NOT NULL,
    unit_price   INTEGER NOT NULL,
    line_total   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_status_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   TEXT NOT NULL REFERENCES orders(id),
    status     TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    changed_by TEXT NOT NULL DEFAULT 'system',
    note       TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS idx_status_history_order_id ON order_status_history(order_id);
`);

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `RL-${date}-${suffix}`;
}

module.exports = { db, generateOrderId };
