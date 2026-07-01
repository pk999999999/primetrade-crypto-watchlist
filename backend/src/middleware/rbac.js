/**
 * Role-Based Access Control Middleware
 * Checks if the authenticated user has the required role
 * Must be used AFTER the authenticate middleware
 * 
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'user')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}. Your role: ${req.user.role}.`
      });
    }

    next();
  };
}
