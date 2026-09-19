const mongoose = require('mongoose');

/**
 * VehicleDayLock
 * ---------------
 * One document per (vehicle, calendar day) that a vehicle is booked for.
 *
 * This is the piece that actually prevents double-booking. A plain
 * "check for overlapping contracts, then insert" approach has a race
 * window: two booking requests for the same vehicle can both pass the
 * overlap check before either insert lands. The unique compound index
 * below makes MongoDB itself reject the second booking - not application
 * timing - so the guarantee holds even under concurrent requests.
 *
 * bookingService.createRentalBooking() inserts one lock document per day
 * of the stay AND the RentalContract inside a single transaction. If any
 * day is already locked, the whole transaction aborts with no partial
 * writes.
 */
const VehicleDayLockSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    // Normalized to midnight UTC so "one day" always means the same thing
    // regardless of what time a booking starts/ends.
    date: { type: Date, required: true },
    rentalContractId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalContract', required: true }
  },
  { timestamps: true }
);

VehicleDayLockSchema.index({ vehicleId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('VehicleDayLock', VehicleDayLockSchema);
