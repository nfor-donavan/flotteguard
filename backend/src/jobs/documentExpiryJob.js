const cron = require('node-cron');
const Vehicle = require('../models/Vehicle');
const Tenant = require('../models/Tenant');
const { sendSms } = require('../services/smsService');

const WARNING_WINDOW_DAYS = 7;

/**
 * Runs once daily. Finds every vehicle whose insurance or "vignette"
 * (road tax sticker) expires within the warning window and SMS's the
 * owning tenant's phone, so they can renew before a police checkpoint
 * turns into an impoundment.
 *
 * Single-instance note: this only runs safely as-is because the pilot
 * deployment is a single Render instance. If you ever run more than one
 * instance, add a distributed lock (e.g. a short-lived unique document in
 * Mongo for "documentExpiryJob:<date>") before the query below, or every
 * instance will send the same SMS.
 */
async function runDocumentExpiryCheck() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const expiringVehicles = await Vehicle.find({
    $or: [
      { 'documents.insuranceExpiry': { $gte: now, $lte: windowEnd } },
      { 'documents.vignetteExpiry': { $gte: now, $lte: windowEnd } }
    ]
  }).lean();

  if (expiringVehicles.length === 0) {
    console.log('[documentExpiryJob] No vehicles with documents expiring soon.');
    return;
  }

  const tenantIds = [...new Set(expiringVehicles.map((v) => String(v.tenantId)))];
  const tenants = await Tenant.find({ _id: { $in: tenantIds } }).lean();
  const tenantById = new Map(tenants.map((t) => [String(t._id), t]));

  for (const vehicle of expiringVehicles) {
    const tenant = tenantById.get(String(vehicle.tenantId));
    if (!tenant) continue;

    const alerts = [];
    if (vehicle.documents.insuranceExpiry >= now && vehicle.documents.insuranceExpiry <= windowEnd) {
      alerts.push(`insurance expires ${vehicle.documents.insuranceExpiry.toISOString().slice(0, 10)}`);
    }
    if (vehicle.documents.vignetteExpiry >= now && vehicle.documents.vignetteExpiry <= windowEnd) {
      alerts.push(`vignette expires ${vehicle.documents.vignetteExpiry.toISOString().slice(0, 10)}`);
    }

    const message = `FlotteGuard alert: ${vehicle.plateNumber} (${vehicle.makeModel}) - ${alerts.join(', ')}. Renew now to avoid impoundment.`;

    try {
      await sendSms(tenant.ownerPhone, message);
      console.log(`[documentExpiryJob] Alerted ${tenant.businessName} about ${vehicle.plateNumber}`);
    } catch (err) {
      console.error(`[documentExpiryJob] Failed to SMS ${tenant.ownerPhone}:`, err.message);
    }
  }
}

/** Registers the daily 7am cron job. Call once at server startup. */
function scheduleDocumentExpiryJob() {
  // Runs every day at 07:00 server time.
  cron.schedule('0 7 * * *', () => {
    runDocumentExpiryCheck().catch((err) => {
      console.error('[documentExpiryJob] Unhandled error:', err);
    });
  });
  console.log('[documentExpiryJob] Scheduled for 07:00 daily.');
}

module.exports = { scheduleDocumentExpiryJob, runDocumentExpiryCheck };
