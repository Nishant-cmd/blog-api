import passport from "../config/passport.js";

const requireAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({
        error: info?.message || "Unauthorized — provide a valid Bearer token",
      });
    }

    req.user = user;
    return next();
  })(req, res, next);
};

export const optionalAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (user) req.user = user;
    return next();
  })(req, res, next);
};

export default requireAuth;
