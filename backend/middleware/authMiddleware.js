/**
 * ==========================================================================
 * CAMPUS CARE - Administrator Authorization Middleware
 * ==========================================================================
 * 
 * SECURITY ENFORCEMENT:
 * Strictly enforces that ONLY the single designated administrator account
 * (configured via VITE_ADMIN_EMAIL or ADMIN_EMAIL) can perform administrative
 * operations, including deleting items and transitioning item status to
 * 'Returned' or 'Verified'.
 */

const dotenv = require('dotenv');
const path = require('path');

// Ensure environment variables are loaded
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Resolves the single designated administrator email from environment variables.
 * Defaults to 'admin@college.edu'.
 */
function getDesignatedAdminEmail() {
  const email = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@college.edu';
  return email.trim().toLowerCase();
}

/**
 * Extracts the requester email from incoming request headers, body, or query parameters.
 */
function getRequesterEmail(req) {
  let email = (
    req.headers['x-admin-email'] ||
    req.headers['x-user-email'] ||
    req.headers['admin-email'] ||
    req.body?.adminEmail ||
    req.body?.admin_email ||
    req.query?.adminEmail ||
    req.query?.admin_email ||
    ''
  );

  // Also check Bearer Authorization header if provided as an email or token
  const authHeader = req.headers['authorization'];
  if (!email && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.includes('@')) {
      email = token;
    }
  }

  return (email || '').trim().toLowerCase();
}

/**
 * Middleware: Requires single designated administrator authorization.
 * Returns 403 Forbidden if requester email does not match VITE_ADMIN_EMAIL.
 */
function requireAdmin(req, res, next) {
  const designatedAdmin = getDesignatedAdminEmail();
  const requester = getRequesterEmail(req);

  if (!requester || requester !== designatedAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied',
      message: `You do not have permission to access the Campus Care Administration Panel or perform administrative actions. Only the designated administrator (${designatedAdmin}) is authorized.`
    });
  }

  next();
}

module.exports = {
  getDesignatedAdminEmail,
  getRequesterEmail,
  requireAdmin
};
