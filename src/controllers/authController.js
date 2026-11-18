import jwt from "jsonwebtoken";
import passport from "../config/passport.js";
import { getUserByEmail } from "../models/userModel.js";

export const login = (req, res, next) => {
  passport.authenticate("local", { session: false }, async (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({ error: info?.message || "Unauthorized" });
    }

    const { password: _pw, ...safeUser } = user;

    const token = jwt.sign(
      { user: safeUser },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
    });
  })(req, res, next);
};

export const logout = (_req, res) => {
  res.status(200).json({ message: "Logged out. Remove the token on the client." });
};
