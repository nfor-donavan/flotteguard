const express = require('express');
const Vehicle = require('../models/Vehicle');
const ApiError = require('../utils/ApiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const { getSignedUploadParams } = require('../services/uploadService');

const router = express.Router();
router.use(requireAuth, tenantScope);

const isStaff = (req) => ['owner', 'manager'].includes(req.auth.role);

// Maintenance notes (and their photos) are internal - customers and drivers
// must never receive them.
const publicProjection = (req) => (isStaff(req) ? undefined : '-maintenance');

// Staff upload vehicle / maintenance photos straight to Cloudinary.
// Declared before '/:id' so "upload-signature" isn't read as an id.
router.get('/upload-signature', requireRole('owner', 'manager'), (req, res) => {
  res.json(getSignedUploadParams(`flotteguard/${req.tenantId}/vehicles`));
});

router.get('/', async (req, res) => {
  const { status } = req.query;
  const filter = { tenantId: req.tenantId };
  if (status) filter.status = status;
  const vehicles = await Vehicle.find(filter, publicProjection(req)).sort({ createdAt: -1 });
  res.json({ vehicles });
});

router.get('/:id', async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, tenantId: req.tenantId }, publicProjection(req));
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.json({ vehicle });
});

router.post('/', requireRole('owner', 'manager'), async (req, res) => {
  const vehicle = await Vehicle.create({ ...req.body, tenantId: req.tenantId });
  res.status(201).json({ vehicle });
});

router.patch('/:id', requireRole('owner', 'manager'), async (req, res) => {
  const { tenantId: _ignored, _id: _ignoredId, ...updates } = req.body; // never let the body re-home a vehicle
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    updates,
    { new: true, runValidators: true }
  );
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.json({ vehicle });
});

router.delete('/:id', requireRole('owner'), async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.status(204).send();
});

module.exports = router;
