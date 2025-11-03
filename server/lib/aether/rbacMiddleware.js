/**
 * RBAC middleware for AETHER endpoints
 * Checks for admin role or AETHER_ADMIN_KEY header
 */
export function aetherAuthMiddleware(req, res, next) {
  // DEVELOPMENT MODE: Bypass authentication
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Development mode: Bypassing AETHER auth check');
    return next();
  }

  // Check for AETHER_ADMIN_KEY in header (for CI/scripted access)
  const adminKey = process.env.AETHER_ADMIN_KEY;
  const providedKey = req.headers['x-aether-admin-key'];
  
  if (adminKey && providedKey === adminKey) {
    console.log('[AETHER RBAC] Authenticated via admin key');
    return next();
  }

  // Check for existing isAdmin middleware result
  // This assumes the route already uses isAuthenticated + isAdmin
  if (req.user && req.user.isAdmin) {
    return next();
  }

  // Check if user is authenticated at all
  if (!req.user || !req.isAuthenticated || !req.isAuthenticated()) {
    console.warn('[AETHER RBAC] Unauthorized: Not authenticated');
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access AETHER'
    });
  }

  // User is authenticated but not admin
  console.warn('[AETHER RBAC] Forbidden: Not admin', { userId: req.user.id });
  return res.status(403).json({
    error: 'Forbidden',
    message: 'AETHER access requires admin privileges'
  });
}

/**
 * Standalone AETHER auth check (when not using existing isAuthenticated/isAdmin)
 */
export function aetherAuthStandalone(req, res, next) {
  // Check for AETHER_ADMIN_KEY in header
  const adminKey = process.env.AETHER_ADMIN_KEY;
  const providedKey = req.headers['x-aether-admin-key'];
  
  if (adminKey && providedKey === adminKey) {
    console.log('[AETHER RBAC] Authenticated via admin key');
    req.aetherAuth = { method: 'admin_key' };
    return next();
  }

  // If no admin key set and no user session, reject
  return res.status(401).json({
    error: 'Authentication required',
    message: 'Set AETHER_ADMIN_KEY or authenticate as admin'
  });
}
