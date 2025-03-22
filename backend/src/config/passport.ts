import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import User from 'models/user.model';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'default_jwt_secret';

export const configurePassport = (passport: any) => {
  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: SECRET_KEY,
  };

  passport.use(
    new JwtStrategy(options, async (jwtPayload, done) => {
      try {
        // Find the user by ID from JWT payload
        const user = await User.findById(jwtPayload.id);

        if (user) {
          // If user found, return the user
          return done(null, user);
        }
        // If user not found, return false
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );
}; 