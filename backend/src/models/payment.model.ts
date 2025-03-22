import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  amount: number;
  currency: string;
  method: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentIntent?: string;
  paymentMethod?: {
    type: string;
    last4?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cardholderName?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD'
    },
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'cash'],
      required: [true, 'Payment method is required']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentIntent: {
      type: String
    },
    paymentMethod: {
      type: {
        type: String
      },
      last4: String,
      expiryMonth: String,
      expiryYear: String,
      cardholderName: String
    },
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  {
    timestamps: true
  }
);

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment; 