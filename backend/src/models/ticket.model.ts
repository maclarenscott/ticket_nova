import mongoose, { Document, Schema, Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { IEvent } from './event.model';
import { IUser } from './user.model';

export interface ITicket extends Document {
  ticketNumber: string;
  event: Types.ObjectId | IEvent;
  performance: {
    date: Date;
    startTime: string;
    endTime: string;
  };
  customer: Types.ObjectId | IUser;
  purchaseDate: Date;
  price: number;
  category: 'premium' | 'standard' | 'economy';
  section?: string;
  row?: string;
  seat?: string;
  seatNumber?: string;
  status: 'reserved' | 'purchased' | 'refunded' | 'cancelled' | 'checked-in' | 'active';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'paid' | 'cancelled';
  paymentMethod?: 'credit_card' | 'debit_card' | 'cash' | 'other';
  barcodeData?: string;
  qrCodeData?: string;
  isTransferred: boolean;
  customerDetails?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => `TKT-${nanoid(10).toUpperCase()}`,
    },
    event: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Generate barcode and QR code data before saving if not already set
ticketSchema.pre('save', function(next) {
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

const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);

export default Ticket; 