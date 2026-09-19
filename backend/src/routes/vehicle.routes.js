const express = require('express');
const Vehicle = require('../models/Vehicle');
const ApiError = require('../utils/ApiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');

const router = express.Router();
router.use(requireAuth, tenantScope);

router.get('/', async (req, res) => {
  const { status } = req.query;
  const filter = { tenantId: req.tenantId };
  if (status) filter.status = status;
  const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
  res.json({ vehicles });
});

router.get('/:id', async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!vehicle) throw new ApiError(404, 'Vehicle not found');
  res.json({ vehicle });
});

router.post('/', requireRole('owner', 'manager'), async (req, res) => {
  const vehicle = await Vehicle.create({ ...req.body, tenantId: req.tenantId });
  res.status(201).json({ vehicle });
});

router.patch('/:id', requireRole('owner', 'manager'), async (req, res) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    req.body,
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
