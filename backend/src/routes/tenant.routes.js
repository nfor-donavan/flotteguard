const express = require('express');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const DailyLog = require('../models/DailyLog');
const RentalContract = require('../models/RentalContract');
const ApiError = require('../utils/ApiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');

const router = express.Router();
router.use(requireAuth, tenantScope);

router.get('/me', async (req, res) => {
  const tenant = await Tenant.findById(req.tenantId);
  if (!tenant) throw new ApiError(404, 'Tenant not found');
  res.json({ tenant });
});

router.post('/staff', requireRole('owner'), async (req, res) => {
  const { name, phone, role, password } = req.body;
  if (!['manager', 'driver', 'renter'].includes(role)) {
    throw new ApiError(400, 'role must be manager, driver, or renter');
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ tenantId: req.tenantId, name, phone, role, passwordHash });
  res.status(201).json({ user });
});

router.get('/staff', requireRole('owner', 'manager'), async (req, res) => {
  const users = await User.find({ tenantId: req.tenantId });
  res.json({ users });
});

/**
 * Financial diagnostics summary for the admin dashboard home screen:
 * fleet status breakdown, this month's taxi settlement shortfalls, and
 * upcoming rental revenue.
 */
router.get('/dashboard-summary', requireRole('owner', 'manager'), async (req, res) => {
  const tenantId = req.tenantId;
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [vehiclesByStatus, monthLogs, activeRentals] = await Promise.all([
    Vehicle.aggregate([{ $match: { tenantId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    DailyLog.find({ tenantId, date: { $gte: startOfMonth } }),
    RentalContract.find({ tenantId, status: 'Confirmed', endDate: { $gte: new Date() } })
  ]);

  const totalExpected = monthLogs.reduce((sum, l) => sum + l.expectedRevenue, 0);
  const totalSubmitted = monthLogs.reduce((sum, l) => sum + l.submittedRevenue, 0);
  const shortfallCount = monthLogs.filter((l) => l.status === 'Shortfall').length;

  res.json({
    vehiclesByStatus,
    monthToDate: {
      expectedRevenue: totalExpected,
      submittedRevenue: totalSubmitted,
      shortfallCount
    },
    activeRentalsCount: activeRentals.length,
    upcomingRentalRevenue: activeRentals.reduce((sum, r) => sum + r.totalCost, 0)
  });
});

module.exports = router;
