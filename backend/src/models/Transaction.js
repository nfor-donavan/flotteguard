const mongoose = require('mongoose');

/**
 * Every inbound Mobile Money webhook is recorded here, keyed by the
 * provider's own transaction reference. Orange Money and MTN MoMo both
 * retry webhook delivery, so without this ledger a retried webhook would
 * re-apply the same payment (double-crediting a deposit, for example).
 * The unique index on providerReference is what makes processing
 * idempotent: a duplicate webhook fails to insert and is safely ignored.
 */
const TransactionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    provider: { type: String, enum: ['orange_money', 'mtn_momo'], required: true },
    providerReference: { type: String, required: true }, // unique ID from the provider's webhook payload
    relatedType: { type: String, enum: ['RentalContract', 'DailyLog'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0 }, // XAF
    status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    rawPayload: { type: mongoose.Schema.Types.Mixed } // stored for reconciliation/debugging
  },
  { timestamps: true }
);

TransactionSchema.index({ provider: 1, providerReference: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
