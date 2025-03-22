import mongoose, { Document, Schema, Types } from 'mongoose';
import { IVenue } from './venue.model';

export interface IEvent extends Document {
  title: string;
  description: string;
  venue: Types.ObjectId | IVenue;
  organizer: Types.ObjectId;
  category: 'theater' | 'concert' | 'comedy' | 'dance' | 'family' | 'other';
  startDate: Date;
  endDate: Date;
  duration: number; // in minutes
  image?: string; // URL to event image
  isPublished: boolean;
  isFeatured: boolean;
  isActive: boolean;
  performances: {
    date: Date;
    startTime: string;
    endTime: string;
    ticketPricing: {
      category: 'premium' | 'standard' | 'economy';
      price: number;
      availableSeats: number;
    }[];
    isSoldOut: boolean;
  }[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
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
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: [true, 'Venue is required'],
    },
    organizer: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Validate that end date is after start date
eventSchema.pre('validate', function(next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

// Virtual for calculating total available tickets
eventSchema.virtual('totalAvailableTickets').get(function(this: IEvent) {
  if (!this.performances || this.performances.length === 0) {
    return 0;
  }
  
  return this.performances.reduce((total, performance) => {
    if (!performance.ticketPricing || performance.ticketPricing.length === 0) {
      return total;
    }
    
    const performanceTotal = performance.ticketPricing.reduce(
      (sum, pricing) => sum + pricing.availableSeats, 
      0
    );
    
    return total + performanceTotal;
  }, 0);
});

// Ensure virtual fields are included in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model<IEvent>('Event', eventSchema);

export default Event; 