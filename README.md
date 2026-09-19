# FlotteGuard

Multi-tenant fleet & rental management platform for car rental agencies and
taxi fleet operators. Three parts in one repo:

```
flotteguard/
├── backend/           Node.js + Express + MongoDB (Mongoose) API
├── admin-dashboard/    React + Vite web app for owners/fleet managers
└── mobile-app/         React Native + Expo app (Driver mode + Renter mode)
```

## What's built

- **Multi-tenant isolation** enforced in one middleware (`tenantScope.js`) -
  every route trusts the authenticated user's tenant, never the request body.
- **JWT auth** with roles (owner, manager, driver, renter, platform_admin).
- **Double-booking-safe rental bookings** (`bookingService.js`) using MongoDB
  transactions + a unique per-day lock. Proven under real concurrency by
  `backend/tests/bookingService.test.js`, which fires two overlapping
  booking requests at once and asserts exactly one succeeds.
- **Idempotent Mobile Money webhooks** (Orange Money / MTN MoMo) so a
  retried webhook can't double-credit a payment.
- **Daily document-expiry SMS cron job.**
- **Cloudinary signed uploads** so receipt/ID photos never pass through
  your server.
- **Admin dashboard**: dashboard summary, and full read + write flows for
  Vehicles (add, edit status/mileage, remove), Rentals (new booking with a
  live availability check, cancel), Daily Logs (record a turn-in manually),
  and Staff (add managers/drivers/renters).
- **Mobile app**: driver mode with a vehicle picker and camera-based fuel
  receipt upload; renter mode with a real date picker, live availability
  preview, and ID-photo upload, all going through the same
  double-booking-safe endpoint as the dashboard.

## What's still a placeholder (needs your own credentials, not more code)

- **SMS gateway and Mobile Money integrations** are wired with the right
  shape (signature verification, idempotency) but use placeholder field
  names - map them to whatever provider you get approved with, since
  Orange Money / MTN MoMo API access requires a business registration
  process specific to your account.
- No end-to-end/UI tests yet - only the booking service has automated tests
  so far, since that was the highest-risk piece.

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in your MongoDB Atlas URI and a JWT secret
npm install
npm run seed             # creates a demo tenant, owner, driver, and 2 vehicles
npm run dev
```

Demo login after seeding: phone `+237600000000`, password `changeme123`.

Run the booking-safety tests (spins up an in-memory MongoDB replica set,
no Atlas connection needed):

```bash
npm test
```

### 2. Admin dashboard

```bash
cd admin-dashboard
cp .env.example .env    # point VITE_API_URL at your backend
npm install
npm run dev
```

### 3. Mobile app

```bash
cd mobile-app
npm install
npx expo start
```

Before running, edit `src/api/client.js` and replace the placeholder
`BASE_URL` with your machine's LAN IP (a phone can't reach `localhost`) or
your deployed backend URL.

## Deployment notes

- Backend deploys to Render as-is (`npm start`). Set every variable from
  `.env.example` in Render's dashboard.
- MongoDB Atlas's free/shared tier already runs as a replica set, so the
  transactions used for booking and cancellation work without extra config.
- The document-expiry cron job runs inside the Express process, which is
  safe on a single Render instance (your current plan). If you scale to
  multiple instances, move it to Render's own Cron Job feature or add a
  distributed lock first - otherwise every instance sends duplicate SMS.

## App icon

Wired in as the favicon for the admin dashboard (`admin-dashboard/public/`)
and as the app icon/splash for the Expo mobile app (`mobile-app/assets/`).
