# Contract: photos, maintenance issues, driver profiles, chart data

Shared by backend, admin-dashboard and mobile-app. Backend is implemented by the
coordinator; frontends code against this exactly.

## Image URLs
Every image URL stored in the DB is EITHER an absolute https URL (Cloudinary uploads)
OR a relative path starting with `/demo/` (bundled demo images served by the backend
at `<API origin>/demo/...`). Clients MUST resolve with a helper:

    assetUrl(u) = !u ? null : /^https?:\/\//.test(u) ? u : API_ORIGIN + u

where API_ORIGIN = the API base URL without the trailing `/api`.
- admin: `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'` minus `/api`
- mobile: `BASE_URL` in src/api/client.js minus `/api` (export a helper from there)

## Models
Vehicle (new fields)
- `photos: string[]`   (first = cover photo; may be empty -> show a tasteful placeholder)
- `maintenance: { issue: string, severity: 'Low'|'Medium'|'High', reportedAt: Date, expectedReadyDate: Date, photos: string[] }`
  (always present in JSON as an object; `photos` defaults to []; `issue` absent/empty when nothing reported)
  NOTE: PATCH replaces nested objects wholesale -> always send the FULL `maintenance` object.
  Renters and drivers never receive `maintenance` (backend strips it) - it is internal.

User (new fields)
- `photoUrl: string`
- `driverProfile: { licenseNumber: string, licenseExpiry: Date, yearsExperience: number, languages: string[], bio: string }`

RentalContract (new fields)
- `driverId: ObjectId (ref User, optional)`  -> chauffeur-driven rental. List endpoints populate it as
  `{ _id, name, phone, photoUrl }`.

## Endpoints (all under /api, Bearer JWT, tenant-scoped)
- `GET  /vehicles`, `GET /vehicles/:id`  -> include `photos` (+ `maintenance` for owner/manager only)
- `PATCH /vehicles/:id`, `POST /vehicles` (owner/manager) -> may include `photos`, `maintenance`
- `GET  /vehicles/upload-signature` (owner/manager) -> `{ timestamp, signature, apiKey, cloudName, folder }`
  Upload flow (same as the existing receipt upload): POST multipart to
  `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` with fields file, api_key, timestamp, signature, folder;
  response `secure_url` is what gets stored.
- `GET  /drivers` (ANY authenticated role) -> `{ drivers: [{ _id, name, phone, photoUrl, driverProfile, available? }] }`
  - only active users with role `driver`
  - `licenseNumber` is omitted unless caller is owner/manager
  - optional query `startDate` & `endDate` (yyyy-MM-dd): adds boolean `available` = driver has no non-cancelled
    rental overlapping those dates
- `GET  /tenant/staff` (owner/manager) -> users now include `photoUrl`, `driverProfile`
- `PATCH /tenant/staff/:id` (owner/manager) -> body any of `name, phone, photoUrl, driverProfile, isActive` ->
  `{ user }`   (send FULL `driverProfile` object)
- `GET  /tenant/upload-signature` (owner/manager) -> same shape as above, for avatars
- `POST /rentals` -> body may include `driverId`. 409 if vehicle booked (existing) or if the driver is already
  assigned to an overlapping rental ("This driver is already assigned for part of the requested dates.").
- `GET  /rentals` -> `driverId` populated (see above), `vehicleId` populated with
  `{ plateNumber, makeModel, photos }`.
- `GET  /tenant/dashboard-summary` (owner/manager) -> existing fields unchanged PLUS:
  - `collectionsTrend: [{ date: 'YYYY-MM-DD', expected: number, submitted: number }]`  last 14 days, zero-filled, oldest first
  - `rentalRevenueByMonth: [{ month: 'YYYY-MM', revenue: number }]`  last 6 months incl. current, zero-filled,
    non-cancelled contracts grouped by startDate month, sum of totalCost
  - `maintenanceVehicles: [{ _id, plateNumber, makeModel, photos, maintenance }]`
  - `alerts: [{ vehicleId, plateNumber, makeModel, type: 'insurance'|'vignette', expiry, daysLeft }]`
    documents expired or expiring within 30 days, sorted by daysLeft ascending (negative = already expired)

## Demo image files (served at `/demo/...`, stored in DB as these relative paths)
Vehicles (`/demo/vehicles/<key>-1.jpg` exterior, `<key>-2.jpg` interior), 1600x1000-ish JPG, keys:
`prado`, `eclass`, `corolla`, `hiace`, `pickup`, `elantra`, `sportage`
Maintenance issue photos: `/demo/issues/pickup-issue-1.jpg`, `pickup-issue-2.jpg`,
`sportage-issue-1.jpg`, `sportage-issue-2.jpg`
Driver portraits (square): `/demo/drivers/aminatou.jpg`, `joel.jpg`, `serge.jpg`, `nadine.jpg`
