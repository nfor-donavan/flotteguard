const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  // Mongoose duplicate key error (e.g. plate already exists for this tenant,
  // or a VehicleDayLock collision on an overlapping booking)
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'That record conflicts with an existing one.',
      details: err.keyValue
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  console.error('[unhandled error]', err);
  return res.status(500).json({ error: 'Something went wrong on our end.' });
}

module.exports = errorHandler;
