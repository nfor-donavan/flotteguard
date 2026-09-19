const express = require('express');
const Transaction = require('../models/Transaction');
const RentalContract = require('../models/RentalContract');
const ApiError = require('../utils/ApiError');
const { verifyOrangeMoneySignature, verifyMtnMomoSignature } = require('../services/momoService');

const router = express.Router();

/**
 * Both webhook handlers follow the same idempotency pattern:
 *   1. Verify the provider's signature.
 *   2. Try to insert a Transaction keyed on the provider's own reference.
 *      The unique index on {provider, providerReference} makes a retried
 *      webhook a no-op instead of a double-credit.
 *   3. Only after the insert succeeds, apply the side effect (marking the
 *      rental as paid).
 */
router.post('/orange-money/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const signature = req.headers['x-om-signature'];
  const rawBody = req.body.toString('utf8');

  if (!verifyOrangeMoneySignature(rawBody, signature)) {
    throw new ApiError(401, 'Invalid Orange Money webhook signature');
  }

  const payload = JSON.parse(rawBody);
  await recordMomoPayment('orange_money', payload);
  res.status(200).json({ received: true });
});

router.post('/mtn-momo/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const signature = req.headers['x-mtn-signature'];
  const rawBody = req.body.toString('utf8');

  if (!verifyMtnMomoSignature(rawBody, signature)) {
    throw new ApiError(401, 'Invalid MTN MoMo webhook signature');
  }

  const payload = JSON.parse(rawBody);
  await recordMomoPayment('mtn_momo', payload);
  res.status(200).json({ received: true });
});

// NOTE: the payload field names below (reference/amount/contractId) are
// placeholders - map them to whatever field names your actual Orange
// Money / MTN MoMo API version sends once you're enrolled.
async function recordMomoPayment(provider, payload) {
  const { reference, amount, contractId, status } = payload;

  let tx;
  try {
    tx = await Transaction.create({
      tenantId: payload.tenantId,
      provider,
      providerReference: reference,
      relatedType: 'RentalContract',
      relatedId: contractId,
      amount,
      status: status === 'SUCCESSFUL' ? 'confirmed' : 'pending',
      rawPayload: payload
    });
  } catch (err) {
    if (err.code === 11000) {
      // Already processed this exact provider reference - safe to ignore.
      console.log(`[momo webhook] Duplicate ${provider} reference ${reference}, ignoring.`);
      return;
    }
    throw err;
  }

  if (tx.status === 'confirmed') {
    await RentalContract.findByIdAndUpdate(contractId, {
      paymentStatus: 'Deposit_Paid',
      momoReference: reference
    });
  }
}

module.exports = router;
