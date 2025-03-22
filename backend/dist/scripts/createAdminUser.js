"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Define User schema for this script
const userSchema = new mongoose_1.default.Schema({
    firstName: String,
    lastName: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    role: String,
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date
});
const User = mongoose_1.default.model('User', userSchema);
async function createAdminUser() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketing-system';
        await mongoose_1.default.connect(mongoURI);
        console.log('Connected to MongoDB');
        // Generate a random password
        const password = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10).toUpperCase();
        // Hash the password
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // Create the admin user
        const email = 'maclarenscottdev@gmail.com';
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Update user to admin role
            await User.updateOne({ email }, {
                $set: {
                    role: 'Admin',
                    isActive: true
                }
            });
            console.log(`User with email ${email} updated to Admin role`);
            console.log(`Password unchanged - user already exists`);
        }
        else {
            // Create new admin user
            const newUser = new User({
                firstName: 'Admin',
                lastName: 'User',
                email,
                password: hashedPassword,
                role: 'Admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await newUser.save();
            console.log(`Admin user created with email: ${email}`);
            console.log(`Password: ${password}`);
        }
        // Disconnect from MongoDB
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('Error creating admin user:', error);
    }
}
// Run the function
createAdminUser();
//# sourceMappingURL=createAdminUser.js.map