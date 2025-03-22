import mongoose, { Document, Schema } from 'mongoose';

export interface IVenue extends Document {
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  capacity: number;
  facilities: string[];
  seatingMap?: string; // URL to seating map image
  sections: {
    name: string;
    capacity: number;
    priceCategory: 'premium' | 'standard' | 'economy';
    rows?: {
      name: string;
      seats: number;
    }[];
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const venueSchema = new Schema<IVenue>(
  {
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
  },
  {
    timestamps: true,
  }
);

// Virtual for calculating total capacity based on sections
venueSchema.virtual('totalCapacity').get(function(this: IVenue) {
  if (!this.sections || this.sections.length === 0) {
    return this.capacity;
  }
  
  return this.sections.reduce((total, section) => total + section.capacity, 0);
});

// Ensure virtual fields are included in JSON output
venueSchema.set('toJSON', { virtuals: true });
venueSchema.set('toObject', { virtuals: true });

const Venue = mongoose.model<IVenue>('Venue', venueSchema);

export default Venue; 