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
const nanoid_1 = require("nanoid");
const ticketSchema = new mongoose_1.Schema({
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
        default: () => `TKT-${(0, nanoid_1.nanoid)(10).toUpperCase()}`,
    },
    event: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event is required'],
    },
    performance: {
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
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer is required'],
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
    },
    price: {
        type: Number,
        required: [true, 'Ticket price is required'],
        min: [0, 'Price cannot be negative'],
    },
    category: {
        type: String,
        enum: ['premium', 'standard', 'economy'],
        required: [true, 'Ticket category is required'],
    },
    section: {
        type: String,
        trim: true,
    },
    row: {
        type: String,
        trim: true,
    },
    seat: {
        type: String,
        trim: true,
    },
    seatNumber: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['reserved', 'purchased', 'refunded', 'cancelled', 'checked-in', 'active'],
        default: 'reserved',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'paid', 'cancelled'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'cash', 'other'],
    },
    barcodeData: {
        type: String,
    },
    qrCodeData: {
        type: String,
    },
    isTransferred: {
        type: Boolean,
        default: false,
    },
    customerDetails: {
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
        },
    },
}, {
    timestamps: true,
});
// Generate barcode and QR code data before saving if not already set
ticketSchema.pre('save', function (next) {
    if (!this.barcodeData) {
        // Generate a unique code based on ticket number and timestamp
        this.barcodeData = `${this.ticketNumber}-${Date.now()}`;
    }
    if (!this.qrCodeData) {
        // For QR code, we can include more data (usually JSON stringified)
        const qrData = {
            id: this._id,
            event: this.event,
            customer: this.customer,
            ticketNumber: this.ticketNumber,
            date: this.performance.date,
            category: this.category,
            section: this.section,
            row: this.row,
            seat: this.seat,
        };
        this.qrCodeData = JSON.stringify(qrData);
    }
    next();
});
// Index for faster queries
ticketSchema.index({ event: 1, 'performance.date': 1 });
ticketSchema.index({ customer: 1 });
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ status: 1 });
const Ticket = mongoose_1.default.model('Ticket', ticketSchema);
exports.default = Ticket;
//# sourceMappingURL=ticket.model.js.map