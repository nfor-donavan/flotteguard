const express = require('express');
const RentalContract = require('../models/RentalContract');
const ApiError = require('../utils/ApiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const { createRentalBooking, cancelRentalBooking } = require('../services/bookingService');
const { getSignedUploadParams } = require('../services/uploadService');

const router = express.Router();
router.use(requireAuth, tenantScope);

// Renters/staff hit this before uploading an ID/passport photo.
router.get('/upload-signature', (req, res) => {
  res.json(getSignedUploadParams(`flotteguard/${req.tenantId}/client-ids`));
});

router.get('/', async (req, res) => {
  const { vehicleId, status } = req.query;
  const filter = { tenantId: req.tenantId };
  if (vehicleId) filter.vehicleId = vehicleId;
  if (status) filter.status = status;
  const contracts = await RentalContract.find(filter).sort({ startDate: -1 }).populate('vehicleId', 'plateNumber makeModel');
  res.json({ contracts });
});

router.get('/availability', async (req, res) => {
  const { vehicleId, startDate, endDate } = req.query;
  if (!vehicleId || !startDate || !endDate) {
    throw new ApiError(400, 'vehicleId, startDate and endDate are required');
  }
  const conflict = await RentalContract.findOne({
    tenantId: req.tenantId,
    vehicleId,
    status: { $ne: 'Cancelled' },
    startDate: { $lt: new Date(endDate) },
    endDate: { $gt: new Date(startDate) }
  });
  res.json({ available: !conflict });
});

// The one route where double-booking safety actually matters - goes
// through bookingService, never a plain RentalContract.create().
router.post('/', requireRole('owner', 'manager', 'renter'), async (req, res) => {
  const contract = await createRentalBooking({ tenantId: req.tenantId, ...req.body });
  res.status(201).json({ contract });
});

router.post('/:id/cancel', requireRole('owner', 'manager'), async (req, res) => {
  const contract = await cancelRentalBooking({ tenantId: req.tenantId, rentalContractId: req.params.id });
  res.json({ contract });
});

const PAYMENT_STATUSES = ['Pending', 'Deposit_Paid', 'Fully_Paid', 'Refunded'];
const CONTRACT_STATUSES = ['Confirmed', 'Cancelled', 'Completed'];

/**
 * Manual overrides for the two fields that would otherwise only ever
 * change via the Mobile Money webhook (paymentStatus) or never change at
 * all once confirmed (status -> Completed). Needed for day-to-day use
 * before a live MoMo integration is wired up, and for cash payments,
 * which never touch the webhook at all.
 */
router.patch('/:id', requireRole('owner', 'manager'), async (req, res) => {
  const { paymentStatus, status } = req.body;
  const updates = {};

  if (paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new ApiError(400, `paymentStatus must be one of: ${PAYMENT_STATUSES.join(', ')}`);
    }
    updates.paymentStatus = paymentStatus;
  }

  if (status !== undefined) {
    if (!CONTRACT_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${CONTRACT_STATUSES.join(', ')}`);
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'Provide paymentStatus and/or status to update.');
  }

  const contract = await RentalContract.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    updates,
    { new: true, runValidators: true }
  ).populate('vehicleId', 'plateNumber makeModel');

  if (!contract) throw new ApiError(404, 'Rental contract not found for this tenant');
  res.json({ contract });
});

module.exports = router;
