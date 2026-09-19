const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    plateNumber: { type: String, required: true, trim: true, uppercase: true }, // e.g. "LT 123-AA"
    makeModel: { type: String, required: true, trim: true }, // e.g. "Toyota Prado VIP"
    status: {
      type: String,
      enum: ['Available', 'Rented', 'Active_Taxi', 'Maintenance'],
      default: 'Available'
    },
    currentMileage: { type: Number, default: 0, min: 0 },
    nextOilChangeMileage: { type: Number, required: true },
    documents: {
      insuranceExpiry: { type: Date, required: true },
      vignetteExpiry: { type: Date, required: true },
      carteGriseNumber: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

// Plate numbers are scoped uniquely per tenant, not globally. A single plate
// physically belongs to one vehicle, but a global unique index would block a
// second tenant from ever recording a plate that used to belong to someone
// else's now-retired vehicle, and complicates data migrations between
// tenants. Per-tenant uniqueness is what actually matters for this app's
// data integrity.
VehicleSchema.index({ tenantId: 1, plateNumber: 1 }, { unique: true });
VehicleSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
