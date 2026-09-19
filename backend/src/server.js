require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { scheduleDocumentExpiryJob } = require('./jobs/documentExpiryJob');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  scheduleDocumentExpiryJob();

  app.listen(PORT, () => {
    console.log(`[server] FlotteGuard API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
