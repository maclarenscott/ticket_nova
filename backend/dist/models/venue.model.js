"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const venueSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Venue name is required'],
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        required: [true, 'Venue description is required'],
    },
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required'],
        },
        city: {
            type: String,
            required: [true, 'City is required'],
        },
        state: {
            type: String,
            required: [true, 'State is required'],
        },
        zipCode: {
            type: String,
            required: [true, 'ZIP code is required'],
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            default: 'Canada',
        },
    },
    capacity: {
        type: Number,
        required: [true, 'Venue capacity is required'],
        min: [1, 'Capacity must be at least 1'],
    },
    facilities: [{
            type: String,
            trim: true,
        }],
    seatingMap: {
        type: String,
        trim: true,
    },
    sections: [{
            name: {
                type: String,
                required: [true, 'Section name is required'],
                trim: true,
            },
            capacity: {
                type: Number,
                required: [true, 'Section capacity is required'],
                min: [1, 'Section capacity must be at least 1'],
            },
            priceCategory: {
                type: String,
                enum: ['premium', 'standard', 'economy'],
                default: 'standard',
            },
            rows: [{
                    name: {
                        type: String,
                        required: [true, 'Row name is required'],
                        trim: true,
                    },
                    seats: {
                        type: Number,
                        required: [true, 'Number of seats is required'],
                        min: [1, 'Must have at least 1 seat'],
                    },
                }],
        }],
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Virtual for calculating total capacity based on sections
venueSchema.virtual('totalCapacity').get(function () {
    if (!this.sections || this.sections.length === 0) {
        return this.capacity;
    }
    return this.sections.reduce((total, section) => total + section.capacity, 0);
});
// Ensure virtual fields are included in JSON output
venueSchema.set('toJSON', { virtuals: true });
venueSchema.set('toObject', { virtuals: true });
const Venue = mongoose_1.default.model('Venue', venueSchema);
exports.default = Venue;
//# sourceMappingURL=venue.model.js.map