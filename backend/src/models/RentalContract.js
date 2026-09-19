const mongoose = require('mongoose');

const RentalContractSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, required: true, trim: true },
    clientIdPassport: { type: String, required: true, trim: true },
    clientIdPhotoUrl: { type: String, trim: true }, // Cloudinary URL for uploaded ID/passport photo
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    securityDeposit: { type: Number, required: true, min: 0 }, // XAF, whole numbers (zero-decimal currency)
    totalCost: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Deposit_Paid', 'Fully_Paid', 'Refunded'],
      default: 'Pending'
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled', 'Completed'],
      default: 'Confirmed'
    },
    momoReference: { type: String, trim: true } // Mobile Money payment ID
  },
  { timestamps: true }
);

RentalContractSchema.index({ tenantId: 1, vehicleId: 1, startDate: 1, endDate: 1 });

RentalContractSchema.pre('validate', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('endDate must be after startDate'));
  }
  next();
});

module.exports = mongoose.model('RentalContract', RentalContractSchema);
