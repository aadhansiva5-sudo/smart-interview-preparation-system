const { dbAsync } = require('../db');

function requireAuth(req, res, next) {
  // Require both a user ID AND a completed OTP verification flag.
  // Sessions created before OTP verification only have otpPendingEmail set,
  // so checking otpVerified prevents pre-OTP sessions from accessing protected routes.
  if (req.session && req.session.userId && req.session.otpVerified) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'Authentication required. Please log in.'
  });
}

async function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId || !req.session.otpVerified) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }

  try {
    const user = await dbAsync.get('SELECT is_admin FROM users WHERE id = ?', [req.session.userId]);
    if (user && user.is_admin === 1) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  } catch (error) {
    console.error('Require Admin Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error verifying admin privileges.'
    });
  }
}

module.exports = { requireAuth, requireAdmin };

