const crypto = require('crypto');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function signToken(timestamp) {
  return crypto
    .createHmac('sha256', ADMIN_PASSWORD)
    .update(`${timestamp}:admin`)
    .digest('hex');
}

function createToken() {
  const timestamp = Date.now().toString();
  return `${timestamp}:${signToken(timestamp)}`;
}

function verifyToken(token) {
  if (!token) return false;
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  const [timestamp, sig] = parts;
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age < 0 || age > TOKEN_TTL_MS) return false;
  const expected = Buffer.from(signToken(timestamp), 'hex');
  const actual = Buffer.from(sig.padEnd(expected.length * 2, '0').slice(0, expected.length * 2), 'hex');
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

function requireAdmin(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { createToken, requireAdmin, ADMIN_PASSWORD };
