const crypto = require('crypto');

/**
 * Mobile Money webhook signature verification.
 *
 * Both Orange Money and MTN MoMo sign their webhook payloads so you can
 * confirm a request actually came from them and wasn't spoofed. The exact
 * signing scheme differs per provider and per API version you're enrolled
 * in - check the developer portal for the one you're approved for and
 * replace the HMAC logic below with theirs. The important part to keep is
 * the shape: verify BEFORE trusting rawPayload, and do it with a
 * constant-time comparison.
 */
function verifyOrangeMoneySignature(rawBody, signatureHeader) {
  const secret = process.env.ORANGE_MONEY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqual(expected, signatureHeader);
}

function verifyMtnMomoSignature(rawBody, signatureHeader) {
  const secret = process.env.MTN_MOMO_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqual(expected, signatureHeader);
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a || '');
  const bufB = Buffer.from(b || '');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { verifyOrangeMoneySignature, verifyMtnMomoSignature };
