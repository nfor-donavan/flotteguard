const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['owner', 'manager', 'driver', 'renter', 'platform_admin'];

const UserSchema = new mongoose.Schema(
  {
    // platform_admin users have no tenantId - they administer the whole platform.
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: function () {
        return this.role !== 'platform_admin';
      },
      index: true
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// A phone number is unique per tenant (two different agencies may onboard
// the same phone belonging to two different people in real life at pilot
// scale this is rare, but we scope it to be safe rather than global-unique).
UserSchema.index({ tenantId: 1, phone: 1 }, { unique: true, partialFilterExpression: { tenantId: { $exists: true } } });

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

UserSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
module.exports.ROLES = ROLES;
