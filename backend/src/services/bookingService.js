const mongoose = require('mongoose');
const RentalContract = require('../models/RentalContract');
const VehicleDayLock = require('../models/VehicleDayLock');
const Vehicle = require('../models/Vehicle');
const ApiError = require('../utils/ApiError');

/** Returns one Date (midnight UTC) per calendar day in [start, end). */
function eachDayInRange(start, end) {
  const days = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const stop = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor < stop) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/**
 * Creates a rental booking without the possibility of double-booking a
 * vehicle, even under concurrent requests.
 *
 * How it prevents the race that a plain "check then insert" has:
 *   1. Work out every calendar day the rental spans.
 *   2. In a single MongoDB transaction, insert one VehicleDayLock per day
 *      AND the RentalContract itself.
 *   3. VehicleDayLock has a unique index on {vehicleId, date}. If another
 *      booking already holds any of those days, the insert throws a
 *      duplicate-key error, MongoDB aborts the whole transaction, and no
 *      partial data is written.
 *
 * The uniqueness guarantee comes from the database, not from timing
 * between a read and a write - so two simultaneous booking requests for
 * the same vehicle can never both succeed.
 */
async function createRentalBooking({ tenantId, vehicleId, startDate, endDate, ...contractFields }) {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, tenantId });
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found for this tenant');
  }

  const days = eachDayInRange(new Date(startDate), new Date(endDate));
  if (days.length === 0) {
    throw new ApiError(400, 'endDate must be after startDate');
  }

  const session = await mongoose.startSession();
  try {
    let createdContract;

    await session.withTransaction(async () => {
      const [contract] = await RentalContract.create(
        [{ tenantId, vehicleId, startDate, endDate, ...contractFields }],
        { session }
      );

      await VehicleDayLock.insertMany(
        days.map((date) => ({ tenantId, vehicleId, date, rentalContractId: contract._id })),
        { session, ordered: true }
      );

      createdContract = contract;
    });

    return createdContract;
  } catch (err) {
    if (err.code === 11000) {
      // Some day in the requested range is already locked by another booking.
      throw new ApiError(409, 'This vehicle is already booked for part of the requested dates.');
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

/**
 * Cancelling a booking must release its day-locks in the same transaction
 * as the status change, or a cancelled booking would permanently "hold"
 * those days.
 */
async function cancelRentalBooking({ tenantId, rentalContractId }) {
  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      updated = await RentalContract.findOneAndUpdate(
        { _id: rentalContractId, tenantId },
        { status: 'Cancelled' },
        { new: true, session }
      );
      if (!updated) {
        throw new ApiError(404, 'Rental contract not found for this tenant');
      }
      await VehicleDayLock.deleteMany({ rentalContractId }, { session });
    });
    return updated;
  } finally {
    await session.endSession();
  }
}

module.exports = { createRentalBooking, cancelRentalBooking, eachDayInRange };
