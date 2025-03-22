# Ticket Nova

## Enterprise-Grade White-Label Ticketing Platform

Ticket Nova is a comprehensive white-label ticketing solution designed for arts centers, theaters, venues, and event organizers. Our platform provides a fully customizable, standalone ticketing environment that seamlessly integrates with your brand without any external vendor branding.

## Key Features

### Core Ticketing Functionality
- **Customizable Interface**: Fully white-labeled solution that adapts to your organization's branding
- **Multichannel Sales**: Support for online, phone, and in-person ticket purchases
- **Subscription Management**: Flexible subscription packages and season ticket offerings
- **High-Volume Capacity**: Engineered to handle 100,000+ tickets annually with peak-time reliability

### Advanced Administration
- **Event Management**: Comprehensive tools for creating and managing performances
- **Dynamic Pricing**: Implement time-based and demand-based pricing strategies
- **Reporting & Analytics**: Detailed sales reports and performance analytics
- **Venue Management**: Configure multiple venues with custom seating maps

### Customer Experience
- **Intuitive Interface**: Streamlined buying process to maximize conversion rates
- **Mobile Optimization**: Responsive design for all devices
- **Digital Tickets**: Support for e-tickets, print-at-home, and mobile wallet integration
- **Customer Accounts**: Self-service options for ticket holders

### CRM & Marketing
- **Customer Database**: Centralized customer data management
- **Marketing Tools**: Email campaign integration and audience segmentation
- **Fundraising Support**: Donation processing and patron management
- **Audience Insights**: Behavioral analytics and purchasing patterns

## Technical Specifications
- **Cloud-Based SaaS**: Secure, scalable hosting with 99.9% uptime
- **Integration Ready**: APIs for connecting with existing business systems
- **Data Migration**: Comprehensive tools for migrating from legacy systems
- **Security Compliance**: PCI DSS compliance for secure payment processing

## Implementation & Support
- **Dedicated Onboarding**: Complete setup and configuration assistance
- **Staff Training**: Comprehensive training program for administrative users
- **Technical Support**: 24/7 support via email, phone, and chat
- **Regular Updates**: Continuous platform improvements and new features

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, TypeScript, Material-UI
- **Authentication**: JWT, Passport
- **Payment Processing**: Stripe
- **Email Notifications**: Nodemailer
- **Deployment**: Docker, MongoDB Atlas

---

## Developer Documentation

### Architecture Overview

Ticket Nova follows a modern microservices architecture:

1. **API Layer**: RESTful API built with Express and TypeScript
2. **Database Layer**: MongoDB with Mongoose ODM
3. **Frontend Layer**: React SPA with TypeScript and context-based state management
4. **Authentication Layer**: JWT-based auth with role-based access control
5. **Payment Processing Layer**: Integration with Stripe for secure payment handling

### Project Structure

```
ticket_nova/
├── backend/              # Node.js Express API server
│   ├── src/              # Source code
│   │   ├── config/       # Application configuration
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Helper functions
│   └── tests/            # Backend tests
│
├── frontend/             # React.js client
│   ├── public/           # Static files
│   ├── src/              # Source code
│   │   ├── components/   # UI components
│   │   ├── context/      # React Context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client and services
│   │   ├── styles/       # CSS and styling
│   │   └── utils/        # Utility functions
│   └── tests/            # Frontend tests
│
├── shared/               # Shared code between frontend and backend
│   └── types/            # Shared TypeScript interfaces
│
└── docs/                 # Documentation
```

### Setup Instructions

#### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

#### Backend Setup

1. Navigate to the backend directory
   ```bash
   cd backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables:
     ```
     NODE_ENV=development
     PORT=5001
     MONGODB_URI=mongodb://localhost:27017/ticket_nova
     JWT_SECRET=your_secret_key
     JWT_EXPIRES_IN=7d
     STRIPE_SECRET_KEY=your_stripe_secret
     STRIPE_WEBHOOK_SECRET=your_webhook_secret
     ```

4. Start the development server
   ```bash
   npm run dev
   ```

#### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Create `.env` file with:
     ```
     REACT_APP_API_URL=http://localhost:5001
     REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
     ```

4. Start the development server
   ```bash
   npm start
   ```

### API Documentation

The API follows REST principles and returns JSON responses. Authentication is handled via JWT tokens in the Authorization header.

#### Key Endpoints:

- **Auth**: `/api/auth` - Authentication and user management
- **Events**: `/api/events` - Event creation and management
- **Venues**: `/api/venues` - Venue configuration
- **Performances**: `/api/performances` - Performance scheduling
- **Tickets**: `/api/tickets` - Ticket management
- **Orders**: `/api/orders` - Order processing
- **Reports**: `/api/reports` - Reporting and analytics

For comprehensive API documentation, run the backend server and visit `/api-docs`.

### Database Schema

Ticket Nova uses MongoDB with the following main collections:

- **Users**: Customer accounts and staff members
- **Events**: Performance events
- **Venues**: Physical venues with seating arrangements
- **Performances**: Individual performances of events
- **Tickets**: Ticket inventory and sales records
- **Orders**: Customer purchase records
- **Payments**: Payment transaction records

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please ensure your code follows the project's coding standards and includes appropriate tests.

### Testing

#### Backend Tests
```bash
cd backend
npm test
```

#### Frontend Tests
```bash
cd frontend
npm test
```

## License

[ISC License](LICENSE)

## Contact

For support or inquiries, please contact info@ticketnova.com 