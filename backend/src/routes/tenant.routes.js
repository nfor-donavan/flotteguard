const express = require('express');
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const DailyLog = require('../models/DailyLog');
const RentalContract = require('../models/RentalContract');
const ApiError = require('../utils/ApiError');
const { requireAuth, requireRole } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const { getSignedUploadParams } = require('../services/uploadService');

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

// Avatars for drivers/staff are uploaded straight to Cloudinary.
router.get('/upload-signature', requireRole('owner', 'manager'), (req, res) => {
  res.json(getSignedUploadParams(`flotteguard/${req.tenantId}/avatars`));
});

// Edit a team member's profile (photo, driver details, active flag).
router.patch('/staff/:id', requireRole('owner', 'manager'), async (req, res) => {
  const allowed = ['name', 'phone', 'photoUrl', 'driverProfile', 'isActive'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  if (Object.keys(updates).length === 0) throw new ApiError(400, 'Nothing to update.');

  const user = await User.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, updates, {
    new: true,
    runValidators: true
  });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

/**
 * Financial diagnostics summary for the admin dashboard home screen:
 * fleet status breakdown, this month's taxi settlement shortfalls, and
 * upcoming rental revenue.
 */
router.get('/dashboard-summary', requireRole('owner', 'manager'), async (req, res) => {
  // req.tenantId is a plain string (it comes straight off the JWT).
  // Vehicle.find({ tenantId }) auto-casts that string against the
  // ObjectId field, but the aggregation pipeline below does NOT - $match
  // needs an actual ObjectId or it silently matches nothing. This cast is
  // what was making the dashboard show zero vehicles even though the
  // Vehicles tab had real data.
  const tenantId = new mongoose.Types.ObjectId(req.tenantId);
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const now = new Date();
  const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13));
  const monthsStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const [vehiclesByStatus, monthLogs, activeRentals, trendLogs, rentalsForChart, maintenanceVehicles, allVehicles] =
    await Promise.all([
      Vehicle.aggregate([{ $match: { tenantId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      DailyLog.find({ tenantId, date: { $gte: startOfMonth } }),
      RentalContract.find({ tenantId, status: 'Confirmed', endDate: { $gte: now } }),
      DailyLog.find({ tenantId, date: { $gte: trendStart } }).select('date expectedRevenue submittedRevenue'),
      RentalContract.find({ tenantId, status: { $ne: 'Cancelled' }, startDate: { $gte: monthsStart } }).select(
        'startDate totalCost'
      ),
      Vehicle.find({ tenantId, status: 'Maintenance' }).select('plateNumber makeModel photos maintenance'),
      Vehicle.find({ tenantId }).select('plateNumber makeModel documents')
    ]);

  const totalExpected = monthLogs.reduce((sum, l) => sum + l.expectedRevenue, 0);
  const totalSubmitted = monthLogs.reduce((sum, l) => sum + l.submittedRevenue, 0);
  const shortfallCount = monthLogs.filter((l) => l.status === 'Shortfall').length;

  // 14-day collections trend, zero-filled so the chart has no gaps.
  const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
  const trendMap = new Map();
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.UTC(trendStart.getUTCFullYear(), trendStart.getUTCMonth(), trendStart.getUTCDate() + i));
    trendMap.set(dayKey(d), { date: dayKey(d), expected: 0, submitted: 0 });
  }
  for (const l of trendLogs) {
    const row = trendMap.get(dayKey(l.date));
    if (row) {
      row.expected += l.expectedRevenue;
      row.submitted += l.submittedRevenue;
    }
  }

  // Rental revenue per month (last 6 months incl. current), by start month.
  const monthKey = (d) => new Date(d).toISOString().slice(0, 7);
  const monthMap = new Map();
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(monthsStart.getUTCFullYear(), monthsStart.getUTCMonth() + i, 1));
    monthMap.set(monthKey(d), { month: monthKey(d), revenue: 0 });
  }
  for (const r of rentalsForChart) {
    const row = monthMap.get(monthKey(r.startDate));
    if (row) row.revenue += r.totalCost;
  }

  // Documents expired or expiring within 30 days.
  const msPerDay = 24 * 60 * 60 * 1000;
  const alerts = [];
  for (const v of allVehicles) {
    for (const [type, field] of [['insurance', 'insuranceExpiry'], ['vignette', 'vignetteExpiry']]) {
      const expiry = v.documents && v.documents[field];
      if (!expiry) continue;
      const daysLeft = Math.ceil((new Date(expiry) - now) / msPerDay);
      if (daysLeft <= 30) {
        alerts.push({ vehicleId: v._id, plateNumber: v.plateNumber, makeModel: v.makeModel, type, expiry, daysLeft });
      }
    }
  }
  alerts.sort((a, b) => a.daysLeft - b.daysLeft);

  res.json({
    vehiclesByStatus,
    monthToDate: {
      expectedRevenue: totalExpected,
      submittedRevenue: totalSubmitted,
      shortfallCount
    },
    // Total value (totalCost) of Confirmed contracts that haven't ended yet,
    // i.e. in-progress + future bookings, regardless of how much is paid so far.
    activeRentalsCount: activeRentals.length,
    upcomingRentalRevenue: activeRentals.reduce((sum, r) => sum + r.totalCost, 0),
    collectionsTrend: [...trendMap.values()],
    rentalRevenueByMonth: [...monthMap.values()],
    maintenanceVehicles,
    alerts
  });
});

module.exports = router;
