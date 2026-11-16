const express = require('express');
const User = require('../models/User');
const RentalContract = require('../models/RentalContract');
const { requireAuth } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');

const router = express.Router();
router.use(requireAuth, tenantScope);

/**
 * Driver directory. Open to every role in the tenant (customers browse it to
 * pick a chauffeur) but only exposes presentation fields; licenseNumber is
 * staff-only. With startDate/endDate it also flags who is free.
 */
router.get('/', async (req, res) => {
  const isStaff = ['owner', 'manager'].includes(req.auth.role);
  const drivers = await User.find({ tenantId: req.tenantId, role: 'driver', isActive: true }).sort({ name: 1 });

  let busy = null;
  const { startDate, endDate } = req.query;
  if (startDate && endDate) {
    const overlapping = await RentalContract.find({
      tenantId: req.tenantId,
      driverId: { $ne: null },
      status: { $ne: 'Cancelled' },
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) }
    }).select('driverId');
    busy = new Set(overlapping.map((c) => String(c.driverId)));
  }

  const out = drivers.map((d) => {
    const profile = d.driverProfile ? d.driverProfile.toObject() : {};
    if (!isStaff) delete profile.licenseNumber;
    const row = { _id: d._id, name: d.name, phone: d.phone, photoUrl: d.photoUrl, driverProfile: profile };
    if (busy) row.available = !busy.has(String(d._id));
    return row;
  });
  res.json({ drivers: out });
});

module.exports = router;
