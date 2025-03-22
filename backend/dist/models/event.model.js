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
const eventSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
    },
    venue: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Venue',
        required: [true, 'Venue is required'],
    },
    organizer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Organizer is required'],
    },
    category: {
        type: String,
        enum: ['theater', 'concert', 'comedy', 'dance', 'family', 'other'],
        default: 'other',
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 minute'],
    },
    image: {
        type: String,
        trim: true,
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    performances: [
        {
            date: {
                type: Date,
                required: [true, 'Performance date is required'],
            },
            startTime: {
                type: String,
                required: [true, 'Start time is required'],
            },
            endTime: {
                type: String,
                required: [true, 'End time is required'],
            },
            ticketPricing: [
                {
                    category: {
                        type: String,
                        enum: ['premium', 'standard', 'economy'],
                        required: [true, 'Ticket category is required'],
                    },
                    price: {
                        type: Number,
                        required: [true, 'Ticket price is required'],
                        min: [0, 'Price cannot be negative'],
                    },
                    availableSeats: {
                        type: Number,
                        required: [true, 'Available seats are required'],
                        min: [0, 'Available seats cannot be negative'],
                    },
                },
            ],
            isSoldOut: {
                type: Boolean,
                default: false,
            },
        },
    ],
    tags: [{
            type: String,
            trim: true,
        }],
}, {
    timestamps: true,
});
// Validate that end date is after start date
eventSchema.pre('validate', function (next) {
    if (this.endDate && this.startDate && this.endDate < this.startDate) {
        this.invalidate('endDate', 'End date must be after start date');
    }
    next();
});
// Virtual for calculating total available tickets
eventSchema.virtual('totalAvailableTickets').get(function () {
    if (!this.performances || this.performances.length === 0) {
        return 0;
    }
    return this.performances.reduce((total, performance) => {
        if (!performance.ticketPricing || performance.ticketPricing.length === 0) {
            return total;
        }
        const performanceTotal = performance.ticketPricing.reduce((sum, pricing) => sum + pricing.availableSeats, 0);
        return total + performanceTotal;
    }, 0);
});
// Ensure virtual fields are included in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });
const Event = mongoose_1.default.model('Event', eventSchema);
exports.default = Event;
//# sourceMappingURL=event.model.js.map