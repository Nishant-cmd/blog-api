import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import {
  getUserByEmail,
  getUserById,
  rehashUserPassword,
} from "../models/userModel.js";

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await getUserByEmail(email);
        if (!user) {
          return done(null, false, {
            message: "Incorrect username or user doesn't exist",
          });
        }

        const hasBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
        const match = hasBcryptHash
          ? await bcrypt.compare(password, user.password)
          : password === user.password;
        if (!match) {
          return done(null, false, { message: "Incorrect password" });
        }

        if (!hasBcryptHash) {
          await rehashUserPassword(user.id, password);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await getUserById(jwtPayload.user.id);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }),
);

export default passport;
