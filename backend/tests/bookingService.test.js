const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const Tenant = require('../src/models/Tenant');
const Vehicle = require('../src/models/Vehicle');
const RentalContract = require('../src/models/RentalContract');
const VehicleDayLock = require('../src/models/VehicleDayLock');
const { createRentalBooking, cancelRentalBooking } = require('../src/services/bookingService');
const ApiError = require('../src/utils/ApiError');

let replSet;

// Transactions require a replica set, which is why this spins up a
// MongoMemoryReplSet rather than the simpler single-node MongoMemoryServer -
// a plain standalone instance would silently make the transaction code
// path untestable.
beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri(), { dbName: 'flotteguard_test' });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

afterEach(async () => {
  await Promise.all([
    Tenant.deleteMany({}),
    Vehicle.deleteMany({}),
    RentalContract.deleteMany({}),
    VehicleDayLock.deleteMany({})
  ]);
});

async function makeTenantAndVehicle() {
  const tenant = await Tenant.create({ businessName: 'Test Agency', ownerPhone: '+237600000000' });
  const vehicle = await Vehicle.create({
    tenantId: tenant._id,
    plateNumber: 'LT 000-TT',
    makeModel: 'Toyota Prado VIP',
    currentMileage: 1000,
    nextOilChangeMileage: 6000,
    documents: {
      insuranceExpiry: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
      vignetteExpiry: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000)
    }
  });
  return { tenant, vehicle };
}

const baseContractFields = {
  clientName: 'Client One',
  clientPhone: '+237611111111',
  clientIdPassport: 'ID-001',
  securityDeposit: 50000,
  totalCost: 150000
};

describe('bookingService - double-booking prevention', () => {
  test('two concurrent overlapping bookings: exactly one succeeds, the other is rejected with 409', async () => {
    const { tenant, vehicle } = await makeTenantAndVehicle();

    const overlappingRequest = (clientName) =>
      createRentalBooking({
        tenantId: tenant._id,
        vehicleId: vehicle._id,
        startDate: '2026-10-10',
        endDate: '2026-10-13',
        ...baseContractFields,
        clientName
      });

    const results = await Promise.allSettled([overlappingRequest('Client A'), overlappingRequest('Client B')]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(ApiError);
    expect(rejected[0].reason.statusCode).toBe(409);

    // Confirm only one contract actually landed in the database - not just
    // that the promise rejected, but that no partial write slipped through.
    const contracts = await RentalContract.find({ tenantId: tenant._id });
    expect(contracts).toHaveLength(1);

    // 3 nights => 3 day-lock documents, not 6 (i.e. the losing attempt left
    // no orphaned locks behind after its transaction aborted).
    const locks = await VehicleDayLock.find({ vehicleId: vehicle._id });
    expect(locks).toHaveLength(3);
  });

  test('two concurrent non-overlapping bookings on the same vehicle both succeed', async () => {
    const { tenant, vehicle } = await makeTenantAndVehicle();

    const [first, second] = await Promise.all([
      createRentalBooking({
        tenantId: tenant._id,
        vehicleId: vehicle._id,
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        ...baseContractFields
      }),
      createRentalBooking({
        tenantId: tenant._id,
        vehicleId: vehicle._id,
        startDate: '2026-10-05',
        endDate: '2026-10-07',
        ...baseContractFields,
        clientName: 'Client Two'
      })
    ]);

    expect(first._id).toBeDefined();
    expect(second._id).toBeDefined();
    const contracts = await RentalContract.find({ tenantId: tenant._id });
    expect(contracts).toHaveLength(2);
  });

  test('cancelling a booking frees its days for a new booking', async () => {
    const { tenant, vehicle } = await makeTenantAndVehicle();

    const contract = await createRentalBooking({
      tenantId: tenant._id,
      vehicleId: vehicle._id,
      startDate: '2026-11-01',
      endDate: '2026-11-04',
      ...baseContractFields
    });

    await cancelRentalBooking({ tenantId: tenant._id, rentalContractId: contract._id });

    const locksAfterCancel = await VehicleDayLock.find({ vehicleId: vehicle._id });
    expect(locksAfterCancel).toHaveLength(0);

    // The same dates should now be bookable again.
    const rebooked = await createRentalBooking({
      tenantId: tenant._id,
      vehicleId: vehicle._id,
      startDate: '2026-11-01',
      endDate: '2026-11-04',
      ...baseContractFields,
      clientName: 'Client Three'
    });
    expect(rebooked._id).toBeDefined();
  });
});
