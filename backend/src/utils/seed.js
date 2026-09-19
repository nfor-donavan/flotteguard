require('dotenv').config();
const { connectDB } = require('../config/db');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

async function seed() {
  await connectDB();

  const tenant = await Tenant.create({
    businessName: 'Fotso Luxury Rentals',
    businessType: 'mixed',
    ownerPhone: '+237600000000'
  });

  const passwordHash = await User.hashPassword('changeme123');
  await User.create([
    { tenantId: tenant._id, name: 'Fotso Owner', phone: '+237600000000', role: 'owner', passwordHash },
    { tenantId: tenant._id, name: 'Aminatou Driver', phone: '+237600000001', role: 'driver', passwordHash }
  ]);

  await Vehicle.create([
    {
      tenantId: tenant._id,
      plateNumber: 'LT 123-AA',
      makeModel: 'Toyota Prado VIP',
      status: 'Available',
      currentMileage: 42000,
      nextOilChangeMileage: 47000,
      documents: {
        insuranceExpiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        vignetteExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        carteGriseNumber: 'CG-00123'
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
        insuranceExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        vignetteExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        carteGriseNumber: 'CG-00456'
      }
    }
  ]);

  console.log('Seed complete. Owner login: +237600000000 / changeme123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
