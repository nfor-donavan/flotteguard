require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const dailyLogRoutes = require('./routes/dailylog.routes');
const rentalRoutes = require('./routes/rental.routes');
const paymentRoutes = require('./routes/payment.routes');
const tenantRoutes = require('./routes/tenant.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : '*' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Mobile Money webhook routes need the raw body for signature
// verification, so they're mounted BEFORE the JSON body parser.
app.use('/api/payments', paymentRoutes);

app.use(express.json({ limit: '2mb' }));

// Basic protection against brute-forcing login/registration.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/vehicles', vehicleRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/tenant', tenantRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
