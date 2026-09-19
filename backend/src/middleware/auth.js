const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the JWT and attaches { userId, tenantId, role } to req.auth.
 * This is the only place a token is decoded - every downstream piece of
 * tenant scoping and role checking trusts req.auth, not the request body.
 */
function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Missing or malformed Authorization header');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = {
      userId: payload.sub,
      tenantId: payload.tenantId || null,
      role: payload.role
    };
    next();
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

/**
 * Restricts a route to specific roles. Use after requireAuth.
 * e.g. router.post('/vehicles', requireAuth, requireRole('owner', 'manager'), ...)
 */
function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
