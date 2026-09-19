const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true }, // e.g. "Fotso Luxury Rentals"
    businessType: {
      type: String,
      enum: ['rental_agency', 'taxi_fleet', 'mixed'],
      default: 'mixed'
    },
    ownerPhone: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', TenantSchema);
