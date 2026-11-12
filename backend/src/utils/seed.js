require('dotenv').config();
const { connectDB } = require('../config/db');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const DailyLog = require('../models/DailyLog');
const RentalContract = require('../models/RentalContract');
const VehicleDayLock = require('../models/VehicleDayLock');
const { createRentalBooking, cancelRentalBooking } = require('../services/bookingService');

const OWNER_PHONE = '+237600000000';

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

function dateOnly(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function seed() {
  await connectDB();

  // Re-runnable: wipe out any previous demo tenant (and everything scoped to
  // it) before reseeding, rather than piling up duplicate demo data every
  // time this script is run.
  const existing = await Tenant.findOne({ ownerPhone: OWNER_PHONE });
  if (existing) {
    const oldVehicles = await Vehicle.find({ tenantId: existing._id }).select('_id');
    const oldVehicleIds = oldVehicles.map((v) => v._id);
    await Promise.all([
      User.deleteMany({ tenantId: existing._id }),
      Vehicle.deleteMany({ tenantId: existing._id }),
      DailyLog.deleteMany({ tenantId: existing._id }),
      RentalContract.deleteMany({ tenantId: existing._id }),
      VehicleDayLock.deleteMany({ vehicleId: { $in: oldVehicleIds } })
    ]);
    await existing.deleteOne();
    console.log('Cleared previous demo data for this tenant.');
  }

  const tenant = await Tenant.create({
    businessName: 'Fotso Luxury Rentals',
    businessType: 'mixed',
    ownerPhone: OWNER_PHONE
  });

  const passwordHash = await User.hashPassword('changeme123');
  const [owner, manager, driver1, driver2, renter] = await User.create([
    { tenantId: tenant._id, name: 'Fotso Owner', phone: '+237600000000', role: 'owner', passwordHash },
    { tenantId: tenant._id, name: 'Brenda Manager', phone: '+237600000002', role: 'manager', passwordHash },
    { tenantId: tenant._id, name: 'Aminatou Driver', phone: '+237600000001', role: 'driver', passwordHash },
    { tenantId: tenant._id, name: 'Joel Mbarga', phone: '+237600000003', role: 'driver', passwordHash },
    { tenantId: tenant._id, name: 'Carine Nguema', phone: '+237600000004', role: 'renter', passwordHash }
  ]);

  // Six vehicles spanning every status, with a mix of insurance/vignette
  // expiry dates - some already overdue, some inside the 7-day alert
  // window, and most comfortably valid - so the document-expiry alerting
  // and dashboard stats both have something real to show in a demo.
  const [vipPrado, luxuryCoupe, corollaTaxi, hiaceTaxi, pickup, sedanInMx] = await Vehicle.create([
    {
      tenantId: tenant._id,
      plateNumber: 'LT 123-AA',
      makeModel: 'Toyota Prado VIP',
      status: 'Available',
      currentMileage: 42000,
      nextOilChangeMileage: 47000,
      documents: {
        insuranceExpiry: daysFromNow(3),
        vignetteExpiry: daysFromNow(90),
        carteGriseNumber: 'CG-00123'
      }
    },
    {
      tenantId: tenant._id,
      plateNumber: 'LT 777-CC',
      makeModel: 'Mercedes-Benz E-Class',
      status: 'Available',
      currentMileage: 18500,
      nextOilChangeMileage: 25000,
      documents: {
        insuranceExpiry: daysFromNow(140),
        vignetteExpiry: daysFromNow(200),
        carteGriseNumber: 'CG-00777'
      }
    },
    {
      tenantId: tenant._id,
      plateNumber: 'CE 456-BB',
      makeModel: 'Toyota Corolla',
      status: 'Active_Taxi',
      currentMileage: 120000,
      nextOilChangeMileage: 125000,
      documents: {
        insuranceExpiry: daysFromNow(60),
        vignetteExpiry: daysFromNow(60),
        carteGriseNumber: 'CG-00456'
      }
    },
    {
      tenantId: tenant._id,
      plateNumber: 'CE 998-DD',
      makeModel: 'Toyota Hiace',
      status: 'Active_Taxi',
      currentMileage: 95000,
      nextOilChangeMileage: 100000,
      documents: {
        // Already expired - demonstrates the "roadside impoundment risk"
        // alert firing for a document that was never renewed in time.
        insuranceExpiry: daysFromNow(-2),
        vignetteExpiry: daysFromNow(30),
        carteGriseNumber: 'CG-00998'
      }
    },
    {
      tenantId: tenant._id,
      plateNumber: 'LT 234-EE',
      makeModel: 'Nissan Pickup 4x4',
      status: 'Maintenance',
      currentMileage: 76000,
      nextOilChangeMileage: 76500,
      documents: {
        insuranceExpiry: daysFromNow(45),
        vignetteExpiry: daysFromNow(45),
        carteGriseNumber: 'CG-00234'
      }
    },
    {
      tenantId: tenant._id,
      plateNumber: 'LT 512-FF',
      makeModel: 'Hyundai Elantra',
      status: 'Available',
      currentMileage: 31000,
      nextOilChangeMileage: 36000,
      documents: {
        // Inside the 7-day regulatory alert window.
        insuranceExpiry: daysFromNow(150),
        vignetteExpiry: daysFromNow(5),
        carteGriseNumber: 'CG-00512'
      }
    }
  ]);

  // Daily taxi turn-ins for the active taxis - a mix of Settled and
  // Shortfall days over the last week so the Daily Logs page and dashboard
  // collection-rate stat both have real variety to show.
  const dailyLogRows = [
    { vehicle: corollaTaxi, driver: driver1, offset: 0, expected: 12000, submitted: 12000, fuel: 4000 },
    { vehicle: corollaTaxi, driver: driver1, offset: 1, expected: 12000, submitted: 9500, fuel: 3500 },
    { vehicle: corollaTaxi, driver: driver1, offset: 2, expected: 12000, submitted: 12000, fuel: 4200 },
    { vehicle: corollaTaxi, driver: driver1, offset: 3, expected: 12000, submitted: 13000, fuel: 3800 },
    { vehicle: hiaceTaxi, driver: driver2, offset: 0, expected: 18000, submitted: 15000, fuel: 6000 },
    { vehicle: hiaceTaxi, driver: driver2, offset: 1, expected: 18000, submitted: 18000, fuel: 6500 },
    { vehicle: hiaceTaxi, driver: driver2, offset: 2, expected: 18000, submitted: 17000, fuel: 5900 }
  ];

  await DailyLog.create(
    dailyLogRows.map((row) => ({
      tenantId: tenant._id,
      vehicleId: row.vehicle._id,
      driverId: row.driver._id,
      driverName: row.driver.name,
      date: daysFromNow(-row.offset),
      expectedRevenue: row.expected,
      submittedRevenue: row.submitted,
      fuelExpense: row.fuel
    }))
  );

  // Rental bookings created through the real booking service, so the
  // VehicleDayLock collection is populated exactly the way it would be in
  // production - covering a currently-active rental, a fully-paid future
  // booking, a completed past rental, and one that was cancelled.
  const activeBooking = await createRentalBooking({
    tenantId: tenant._id,
    vehicleId: vipPrado._id,
    startDate: dateOnly(daysFromNow(-1)),
    endDate: dateOnly(daysFromNow(2)),
    clientName: 'Carine Nguema',
    clientPhone: '+237600000004',
    clientIdPassport: 'CNI-0098712',
    securityDeposit: 80000,
    totalCost: 150000,
    paymentStatus: 'Deposit_Paid'
  });

  const futureBooking = await createRentalBooking({
    tenantId: tenant._id,
    vehicleId: luxuryCoupe._id,
    startDate: dateOnly(daysFromNow(10)),
    endDate: dateOnly(daysFromNow(14)),
    clientName: 'Eric Talla',
    clientPhone: '+237655112233',
    clientIdPassport: 'PASS-FR0045521',
    securityDeposit: 120000,
    totalCost: 260000,
    paymentStatus: 'Fully_Paid',
    momoReference: 'MOMO-884201'
  });

  const pastBooking = await createRentalBooking({
    tenantId: tenant._id,
    vehicleId: vipPrado._id,
    startDate: dateOnly(daysFromNow(-20)),
    endDate: dateOnly(daysFromNow(-16)),
    clientName: 'Solange Ateba',
    clientPhone: '+237677009988',
    clientIdPassport: 'CNI-0071234',
    securityDeposit: 80000,
    totalCost: 160000,
    paymentStatus: 'Fully_Paid'
  });
  await RentalContract.findByIdAndUpdate(pastBooking._id, { status: 'Completed' });

  const toCancelBooking = await createRentalBooking({
    tenantId: tenant._id,
    vehicleId: sedanInMx._id,
    startDate: dateOnly(daysFromNow(6)),
    endDate: dateOnly(daysFromNow(8)),
    clientName: 'Patrick Essomba',
    clientPhone: '+237699445566',
    clientIdPassport: 'CNI-0055099',
    securityDeposit: 40000,
    totalCost: 70000,
    paymentStatus: 'Pending'
  });
  await cancelRentalBooking({ tenantId: tenant._id, rentalContractId: toCancelBooking._id });

  void manager; // reserved for future role-based demo flows

  console.log('Seed complete.');
  console.log('  Owner login:   +237600000000 / changeme123');
  console.log('  Manager login: +237600000002 / changeme123');
  console.log('  Driver login:  +237600000001 / changeme123');
  console.log('  Renter login:  +237600000004 / changeme123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
