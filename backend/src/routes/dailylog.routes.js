const express = require('express');
const DailyLog = require('../models/DailyLog');
const ApiError = require('../utils/ApiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const { getSignedUploadParams } = require('../services/uploadService');

const router = express.Router();
router.use(requireAuth, tenantScope);

// Drivers hit this before uploading a fuel receipt photo from the app.
router.get('/upload-signature', requireRole('driver', 'owner', 'manager'), (req, res) => {
  res.json(getSignedUploadParams(`flotteguard/${req.tenantId}/fuel-receipts`));
});

router.get('/', requireRole('owner', 'manager'), async (req, res) => {
  const { vehicleId, from, to, status } = req.query;
  const filter = { tenantId: req.tenantId };
  if (vehicleId) filter.vehicleId = vehicleId;
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const logs = await DailyLog.find(filter).sort({ date: -1 }).populate('vehicleId', 'plateNumber makeModel');
  res.json({ logs });
});

// A driver submits their own turn-in for the day.
router.post('/', requireRole('driver', 'owner', 'manager'), async (req, res) => {
  const log = await DailyLog.create({
    ...req.body,
    tenantId: req.tenantId,
    driverId: req.auth.userId
  });
  res.status(201).json({ log });
});

router.get('/:id', requireRole('owner', 'manager'), async (req, res) => {
  const log = await DailyLog.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!log) throw new ApiError(404, 'Daily log not found');
  res.json({ log });
});

module.exports = router;
