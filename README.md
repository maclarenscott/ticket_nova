# Box Office Ticketing System

A comprehensive box office ticketing system designed for venues and event management. This system enables efficient ticket sales through online, phone, and in-person channels while providing powerful management tools for venues, events, and reports.

## Features

- **Multiple Sales Channels**: Support for online, phone, and walk-up ticket sales
- **Venue Management**: Configure venues with detailed seating layouts
- **Event Management**: Create and manage events with multiple performances
- **Subscription Packages**: Support for flexible subscription packages
- **Reporting Tools**: Comprehensive sales and attendance reports
- **User Management**: Role-based access control (admin, manager, staff, customer)
- **Secure Payments**: Integration with Stripe for secure payment processing
- **Digital Tickets**: QR code and barcode support for digital tickets
- **White Label Solution**: Customizable to match organization branding

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, TypeScript, Material-UI
- **Authentication**: JWT, Passport
- **Payment Processing**: Stripe
- **Email Notifications**: Nodemailer
- **Deployment**: Docker, MongoDB Atlas

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup

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
   - Fill in the required environment variables

4. Start the development server
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

## License

[ISC License](LICENSE)

## Contact

For support or inquiries, please contact your_email@example.com 