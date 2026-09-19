const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function issueToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tenantId: user.tenantId ? user.tenantId.toString() : null, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Onboards a brand new agency: creates the Tenant and its first "owner"
 * user in one transaction, so you never end up with an orphaned tenant
 * with no one able to log in, or vice versa.
 */
router.post('/register-tenant', async (req, res) => {
  const { businessName, businessType, ownerPhone, ownerName, password } = req.body;
  if (!businessName || !ownerPhone || !ownerName || !password) {
    throw new ApiError(400, 'businessName, ownerPhone, ownerName and password are required');
  }

  const session = await mongoose.startSession();
  try {
    let tenant, owner;
    await session.withTransaction(async () => {
      [tenant] = await Tenant.create([{ businessName, businessType, ownerPhone }], { session });
      const passwordHash = await User.hashPassword(password);
      [owner] = await User.create(
        [{ tenantId: tenant._id, name: ownerName, phone: ownerPhone, role: 'owner', passwordHash }],
        { session }
      );
    });

    const token = issueToken(owner);
    res.status(201).json({ token, tenant, user: owner });
  } finally {
    await session.endSession();
  }
});

router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    throw new ApiError(400, 'phone and password are required');
  }

  const user = await User.findOne({ phone, isActive: true });
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid phone or password');
  }

  const token = issueToken(user);
  res.json({ token, user });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth.userId);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user });
});

module.exports = router;
