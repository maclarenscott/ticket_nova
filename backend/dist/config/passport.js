"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = void 0;
const passport_jwt_1 = require("passport-jwt");
const user_model_1 = __importDefault(require("../models/user.model"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const SECRET_KEY = process.env.JWT_SECRET || 'default_jwt_secret';
console.log('Passport configuration - JWT Secret key length:', SECRET_KEY.length);
const configurePassport = (passport) => {
    const options = {
        jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: SECRET_KEY,
    };
    console.log('Configuring JWT strategy with options:', {
        ...options,
        secretOrKey: SECRET_KEY ? `${SECRET_KEY.substring(0, 5)}...` : 'not set'
    });
    passport.use(new passport_jwt_1.Strategy(options, async (jwtPayload, done) => {
        try {
            console.log('JWT payload received:', jwtPayload);
            // Find the user by ID from JWT payload
            const user = await user_model_1.default.findById(jwtPayload.id);
            if (user) {
                console.log('User found in JWT strategy:', { id: user._id, role: user.role });
                // If user found, return the user
                return done(null, user);
            }
            console.log('No user found for JWT payload:', jwtPayload);
            // If user not found, return false
            return done(null, false);
        }
        catch (error) {
            console.error('JWT strategy error:', error);
            return done(error, false);
        }
    }));
};
exports.configurePassport = configurePassport;
//# sourceMappingURL=passport.js.map