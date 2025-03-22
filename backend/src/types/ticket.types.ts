import { Document } from 'mongoose';

export interface IPerformance {
  _id: string;
  date: Date;
  startTime: string;
  endTime: string;
}

export interface ITicket extends Document {
  ticketNumber: string;
  event: {
    _id: string;
    title: string;
    description: string;
    category: string;
    venue: {
      _id: string;
      name: string;
      address: string;
    };
  };
  performance: IPerformance;
  customer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  purchaseDate: Date;
  price: number;
  category: string;
  section: string;
  row: string;
  seat: string;
  status: 'reserved' | 'purchased' | 'used' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash';
  barcodeData: string;
  qrCodeData: string;
  isTransferred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Ticket = ITicket; 