import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformance extends Document {
  event: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  availableTickets: number;
  totalCapacity: number;
  ticketTypes: Array<{
    name: string;
    price: number;
    description: string;
    availableCount: number;
  }>;
  isSoldOut: boolean;
  isActive: boolean;
  isCancelled: boolean;
  notes?: string;
  soldTickets: number;
  percentageSold: number;
  createdAt: Date;
  updatedAt: Date;
}

const ticketTypeSchema = new Schema({
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

const performanceSchema = new Schema<IPerformance>({
  event: {
    type: Schema.Types.ObjectId,
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
      validator: function(types: any[]) {
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
performanceSchema.virtual('soldTickets').get(function(this: IPerformance) {
  return this.totalCapacity - this.availableTickets;
});

// Virtual for percentage sold
performanceSchema.virtual('percentageSold').get(function(this: IPerformance) {
  if (this.totalCapacity === 0) return 0;
  return Math.round((this.soldTickets / this.totalCapacity) * 100);
});

// Pre-save hook to update isSoldOut based on availableTickets
performanceSchema.pre<IPerformance>('save', function(next) {
  if (this.availableTickets <= 0) {
    this.isSoldOut = true;
  } else {
    this.isSoldOut = false;
  }
  next();
});

// Index for efficient querying
performanceSchema.index({ event: 1, date: 1 });
performanceSchema.index({ date: 1 });
performanceSchema.index({ isSoldOut: 1 });
performanceSchema.index({ isActive: 1 });

const Performance = mongoose.model<IPerformance>('Performance', performanceSchema);

export default Performance; 