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
const ticketTypeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Ticket type name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    description: {
        type: String,
        trim: true
    },
    availableCount: {
        type: Number,
        required: [true, 'Available count is required'],
        min: [0, 'Available count cannot be negative'],
        default: 0
    }
}, { _id: false });
const performanceSchema = new mongoose_1.Schema({
    event: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event is required']
    },
    date: {
        type: Date,
        required: [true, 'Performance date is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    },
    availableTickets: {
        type: Number,
        required: [true, 'Available tickets count is required'],
        min: [0, 'Available tickets cannot be negative'],
        default: 0
    },
    totalCapacity: {
        type: Number,
        required: [true, 'Total capacity is required'],
        min: [0, 'Total capacity cannot be negative'],
        default: 0
    },
    ticketTypes: {
        type: [ticketTypeSchema],
        default: [],
        validate: {
            validator: function (types) {
                return types.length > 0;
            },
            message: 'At least one ticket type is required'
        }
    },
    isSoldOut: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isCancelled: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Virtual for sold tickets count
performanceSchema.virtual('soldTickets').get(function () {
    return this.totalCapacity - this.availableTickets;
});
// Virtual for percentage sold
performanceSchema.virtual('percentageSold').get(function () {
    if (this.totalCapacity === 0)
        return 0;
    return Math.round((this.soldTickets / this.totalCapacity) * 100);
});
// Pre-save hook to update isSoldOut based on availableTickets
performanceSchema.pre('save', function (next) {
    if (this.availableTickets <= 0) {
        this.isSoldOut = true;
    }
    else {
        this.isSoldOut = false;
    }
    next();
});
// Index for efficient querying
performanceSchema.index({ event: 1, date: 1 });
performanceSchema.index({ date: 1 });
performanceSchema.index({ isSoldOut: 1 });
performanceSchema.index({ isActive: 1 });
const Performance = mongoose_1.default.model('Performance', performanceSchema);
exports.default = Performance;
//# sourceMappingURL=performance.model.js.map