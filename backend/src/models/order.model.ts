import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';
import { IEvent } from './event.model';
import { IPerformance } from './performance.model';
import { IPayment } from './payment.model';

export interface IOrder extends Document {
  customer: mongoose.Types.ObjectId | IUser;
  event: mongoose.Types.ObjectId | IEvent;
  performance: mongoose.Types.ObjectId | IPerformance;
  payment: mongoose.Types.ObjectId | IPayment;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required']
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required']
    },
    performance: {
      type: Schema.Types.ObjectId,
      ref: 'Performance',
      required: [true, 'Performance is required']
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: [true, 'Payment is required']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
orderSchema.index({ customer: 1 });
orderSchema.index({ event: 1 });
orderSchema.index({ performance: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order; 