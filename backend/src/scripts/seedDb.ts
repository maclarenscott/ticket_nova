import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/user.model';
import Venue from '../models/venue.model';
import Event from '../models/event.model';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketing-system');
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Clear existing data
const clearData = async () => {
  try {
    // Only delete events and venues, keep users for login
    await Event.deleteMany({});
    await Venue.deleteMany({});
    console.log('Cleared existing data');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Create admin user if doesn't exist
const createAdminUser = async () => {
  try {
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }
    
    // Create admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin',
      isActive: true
    });
    
    await adminUser.save();
    console.log('Admin user created');
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Create mock venues
const createVenues = async () => {
  try {
    const venues = [
      {
        name: 'Rebecca Cohn Auditorium',
        description: 'The Rebecca Cohn Auditorium is the largest performance venue in the Dalhousie Arts Centre, with excellent acoustics and sightlines.',
        address: {
          street: '6101 University Ave',
          city: 'Halifax',
          state: 'Nova Scotia',
          zipCode: 'B3H 4R2',
          country: 'Canada'
        },
        capacity: 1000,
        facilities: ['Wheelchair Access', 'Concession Stand', 'Coat Check', 'Washrooms'],
        sections: [
          {
            name: 'Orchestra',
            capacity: 500,
            priceCategory: 'premium',
            rows: [
              { name: 'A', seats: 20 },
              { name: 'B', seats: 20 },
              { name: 'C', seats: 20 }
            ]
          },
          {
            name: 'Mezzanine',
            capacity: 300,
            priceCategory: 'standard',
            rows: [
              { name: 'D', seats: 15 },
              { name: 'E', seats: 15 }
            ]
          },
          {
            name: 'Balcony',
            capacity: 200,
            priceCategory: 'economy',
            rows: [
              { name: 'F', seats: 10 },
              { name: 'G', seats: 10 }
            ]
          }
        ],
        isActive: true
      },
      {
        name: 'Sir James Dunn Theatre',
        description: 'A versatile venue perfect for theatre performances, dance recitals, and intimate concerts.',
        address: {
          street: '6101 University Ave',
          city: 'Halifax',
          state: 'Nova Scotia',
          zipCode: 'B3H 4R2',
          country: 'Canada'
        },
        capacity: 300,
        facilities: ['Wheelchair Access', 'Washrooms', 'Stage Lighting'],
        sections: [
          {
            name: 'Main Floor',
            capacity: 200,
            priceCategory: 'standard',
            rows: [
              { name: 'A', seats: 10 },
              { name: 'B', seats: 10 }
            ]
          },
          {
            name: 'Balcony',
            capacity: 100,
            priceCategory: 'economy',
            rows: [
              { name: 'C', seats: 8 },
              { name: 'D', seats: 7 }
            ]
          }
        ],
        isActive: true
      }
    ];

    const createdVenues = await Venue.insertMany(venues);
    console.log(`${createdVenues.length} venues created`);
    return createdVenues;
  } catch (error) {
    console.error('Error creating venues:', error);
    throw error;
  }
};

// Create mock events
const createEvents = async (admin: any, venues: any[]) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const events = [
      {
        title: 'Symphony Nova Scotia: Beethoven\'s 9th',
        description: 'Experience the power and joy of Beethoven\'s monumental Ninth Symphony, featuring the famous "Ode to Joy" chorus. This concert showcases Symphony Nova Scotia\'s full orchestra and chorus in a thrilling performance of one of classical music\'s most beloved masterpieces.',
        venue: venues[0]._id,
        organizer: admin._id,
        category: 'concert',
        startDate: tomorrow,
        endDate: tomorrow,
        duration: 120, // in minutes
        image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        isPublished: true,
        isFeatured: true,
        isActive: true,
        performances: [
          {
            date: tomorrow,
            startTime: '19:30',
            endTime: '21:30',
            ticketPricing: [
              { category: 'premium', price: 85, availableSeats: 500 },
              { category: 'standard', price: 65, availableSeats: 300 },
              { category: 'economy', price: 45, availableSeats: 200 }
            ],
            isSoldOut: false
          }
        ],
        tags: ['symphony', 'orchestra', 'classical', 'beethoven']
      },
      {
        title: 'Halifax Jazz Festival Showcase',
        description: 'A special showcase featuring top jazz performers from the Halifax Jazz Festival. This intimate concert highlights both established and emerging artists in the Canadian jazz scene, with performances ranging from traditional jazz standards to innovative contemporary compositions.',
        venue: venues[1]._id,
        organizer: admin._id,
        category: 'concert',
        startDate: nextWeek,
        endDate: nextWeek,
        duration: 150,
        image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        isPublished: true,
        isFeatured: false,
        isActive: true,
        performances: [
          {
            date: nextWeek,
            startTime: '20:00',
            endTime: '22:30',
            ticketPricing: [
              { category: 'standard', price: 45, availableSeats: 200 },
              { category: 'economy', price: 35, availableSeats: 100 }
            ],
            isSoldOut: false
          }
        ],
        tags: ['jazz', 'music', 'live performance']
      },
      {
        title: 'A Midsummer Night\'s Dream',
        description: 'Shakespeare\'s beloved comedy comes to life in this enchanting production by the Halifax Theatre Company. Set in a magical forest filled with mischievous fairies, confused lovers, and amateur actors, this timeless tale weaves together multiple storylines with humor and poetic beauty.',
        venue: venues[0]._id,
        organizer: admin._id,
        category: 'theater',
        startDate: nextMonth,
        endDate: new Date(nextMonth.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later
        duration: 140,
        image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80',
        isPublished: true,
        isFeatured: true,
        isActive: true,
        performances: [
          {
            date: nextMonth,
            startTime: '19:00',
            endTime: '21:20',
            ticketPricing: [
              { category: 'premium', price: 75, availableSeats: 500 },
              { category: 'standard', price: 60, availableSeats: 300 },
              { category: 'economy', price: 40, availableSeats: 200 }
            ],
            isSoldOut: false
          },
          {
            date: new Date(nextMonth.getTime() + 1 * 24 * 60 * 60 * 1000), // day 2
            startTime: '19:00',
            endTime: '21:20',
            ticketPricing: [
              { category: 'premium', price: 75, availableSeats: 500 },
              { category: 'standard', price: 60, availableSeats: 300 },
              { category: 'economy', price: 40, availableSeats: 200 }
            ],
            isSoldOut: false
          },
          {
            date: new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000), // day 3
            startTime: '14:00',
            endTime: '16:20',
            ticketPricing: [
              { category: 'premium', price: 70, availableSeats: 500 },
              { category: 'standard', price: 55, availableSeats: 300 },
              { category: 'economy', price: 35, availableSeats: 200 }
            ],
            isSoldOut: false
          }
        ],
        tags: ['shakespeare', 'theater', 'comedy', 'classic']
      },
      {
        title: 'Stand-Up Comedy Night',
        description: 'Laugh the night away with some of Canada\'s top stand-up comedians. This hilarious showcase features a diverse lineup of comedic talent, from rising stars to established names in the comedy scene. Prepare for an evening of sharp wit, hilarious observations, and non-stop laughter.',
        venue: venues[1]._id,
        organizer: admin._id,
        category: 'comedy',
        startDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks later
        endDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
        duration: 120,
        image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80',
        isPublished: true,
        isFeatured: false,
        isActive: true,
        performances: [
          {
            date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
            startTime: '20:00',
            endTime: '22:00',
            ticketPricing: [
              { category: 'standard', price: 35, availableSeats: 200 },
              { category: 'economy', price: 25, availableSeats: 100 }
            ],
            isSoldOut: false
          }
        ],
        tags: ['comedy', 'stand-up', 'humor']
      },
      {
        title: 'Maritime Dance Festival',
        description: 'A celebration of dance featuring diverse performances from across the Maritime provinces. This annual festival showcases a variety of dance styles, from ballet and contemporary to traditional folk dances, highlighting the rich cultural heritage and innovative artistic expressions of the region.',
        venue: venues[0]._id,
        organizer: admin._id,
        category: 'dance',
        startDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks later
        endDate: new Date(today.getTime() + 23 * 24 * 60 * 60 * 1000), // 3 weeks + 2 days
        duration: 180,
        image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80',
        isPublished: true,
        isFeatured: true,
        isActive: true,
        performances: [
          {
            date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
            startTime: '18:30',
            endTime: '21:30',
            ticketPricing: [
              { category: 'premium', price: 80, availableSeats: 500 },
              { category: 'standard', price: 60, availableSeats: 300 },
              { category: 'economy', price: 40, availableSeats: 200 }
            ],
            isSoldOut: false
          },
          {
            date: new Date(today.getTime() + 22 * 24 * 60 * 60 * 1000),
            startTime: '18:30',
            endTime: '21:30',
            ticketPricing: [
              { category: 'premium', price: 80, availableSeats: 500 },
              { category: 'standard', price: 60, availableSeats: 300 },
              { category: 'economy', price: 40, availableSeats: 200 }
            ],
            isSoldOut: false
          },
          {
            date: new Date(today.getTime() + 23 * 24 * 60 * 60 * 1000),
            startTime: '14:00',
            endTime: '17:00',
            ticketPricing: [
              { category: 'premium', price: 75, availableSeats: 500 },
              { category: 'standard', price: 55, availableSeats: 300 },
              { category: 'economy', price: 35, availableSeats: 200 }
            ],
            isSoldOut: false
          }
        ],
        tags: ['dance', 'performance', 'culture', 'festival']
      }
    ];

    const createdEvents = await Event.insertMany(events);
    console.log(`${createdEvents.length} events created`);
    return createdEvents;
  } catch (error) {
    console.error('Error creating events:', error);
    throw error;
  }
};

// Main function to seed database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to MongoDB. Exiting...');
      process.exit(1);
    }

    // Clear existing data
    await clearData();

    // Create admin user
    const admin = await createAdminUser();

    // Create venues
    const venues = await createVenues();

    // Create events
    await createEvents(admin, venues);

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Execute the seeding function
seedDatabase(); 