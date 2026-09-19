const ApiError = require('../utils/ApiError');

/**
 * tenantScope
 * -----------
 * This is the single enforcement point for tenant isolation in the whole
 * app. Every route that touches tenant data uses req.tenantId - never a
 * tenantId read from the request body or query string - so a client can
 * never ask for (or accidentally receive) another tenant's data by
 * tampering with a payload.
 *
 * platform_admin users don't belong to a tenant; routes that need to work
 * across tenants (rare - platform-level admin screens) should check
 * req.auth.role directly instead of using this middleware.
 */
function tenantScope(req, _res, next) {
  if (!req.auth || !req.auth.tenantId) {
    throw new ApiError(403, 'This action requires a tenant-scoped account');
  }
  req.tenantId = req.auth.tenantId;
  next();
}

module.exports = tenantScope;
