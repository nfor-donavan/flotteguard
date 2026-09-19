const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driverName: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    expectedRevenue: { type: Number, required: true, min: 0 }, // targeted daily amount (e.g. 10,000 XAF)
    submittedRevenue: { type: Number, required: true, min: 0 }, // actual amount turned in
    fuelExpense: { type: Number, default: 0, min: 0 },
    fuelReceiptUrl: { type: String, trim: true }, // Cloudinary URL
    status: { type: String, enum: ['Settled', 'Shortfall', 'Pending'], default: 'Pending' }
  },
  { timestamps: true }
);

// One log per vehicle per calendar day keeps reconciliation unambiguous and
// stops a driver from accidentally double-submitting the same turn-in.
DailyLogSchema.index({ tenantId: 1, vehicleId: 1, date: 1 });

// Derive status from the numbers rather than trusting whatever the client
// sends, so the financial dashboard can rely on it.
DailyLogSchema.pre('validate', function (next) {
  if (this.submittedRevenue >= this.expectedRevenue) {
    this.status = 'Settled';
  } else if (this.submittedRevenue < this.expectedRevenue) {
    this.status = 'Shortfall';
  }
  next();
});

module.exports = mongoose.model('DailyLog', DailyLogSchema);
