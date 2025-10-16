# AkPrints - Printing Service Application

A modern Next.js web application for a printing service that allows users to place and track orders, with an admin panel for order management.

## Features

### User Features
- **Hero Section**: Welcoming landing page with call-to-action buttons
- **Order Placement**: Complete form for submitting print jobs with file upload
- **Order Tracking**: Track existing orders using phone number and token ID
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Admin Features
- **Admin Login**: Secure authentication for administrators
- **Order Management**: View and update order statuses and payment statuses
- **User Verification**: Manage user verification queue via WhatsApp
- **Dashboard**: Comprehensive overview of all orders and users

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS with custom background styling

## Project Structure

```
ak-prints/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── background.jpg         # Background image (placeholder)
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   └── login/         # Admin login
│   │   ├── api/
│   │   │   └── orders/        # API routes for orders
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main landing page
│   ├── components/
│   │   ├── user/              # User-facing components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   └── TrackOrder.tsx
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       └── utils.ts           # Utility functions
```

## Database Schema

### User Model
- `id`: Unique identifier
- `phone`: Phone number (unique)
- `tokenId`: Unique token for order tracking
- `isVerified`: Admin verification status
- `orders`: Related orders

### Order Model
- `id`: Unique identifier
- `name`: Order name
- `pages`: Total pages (calculated)
- `copies`: Number of copies
- `notes`: Special instructions
- `totalAmount`: Total cost
- `status`: Order status (PENDING, COMPLETED, CANCELLED)
- `paymentStatus`: Payment status (PENDING, PAID, VERIFIED)
- `files`: JSON array of file URLs
- `userId`: Reference to user

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm, pnpm, or yarn

### Installation

1. **Clone and setup**:
   ```bash
   cd ak-prints
   npm install
   ```

2. **Database setup**:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Add background image**:
   - Replace `public/background.jpg` with your preferred background image

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - User interface: http://localhost:3000
   - Admin login: http://localhost:3000/admin/login
   - Admin dashboard: http://localhost:3000/admin/dashboard

### Demo Credentials
- Admin Username: `admin`
- Admin Password: `admin123`

## API Endpoints

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders?phone=xxx&tokenId=xxx` - Get user orders

## TODO Items for Production

### File Upload
- Implement proper file upload handling (Vercel Blob, AWS S3)
- Add PDF page counting using pdf-lib
- File validation and size limits

### Authentication
- Implement proper admin authentication with JWT/sessions
- Add middleware for admin route protection
- Environment variables for admin credentials

### Payment Integration
- Integrate with payment gateways (Razorpay, Stripe)
- UPI QR code display
- Payment verification system

### WhatsApp Integration
- WhatsApp verification links for new users
- Order status notifications via WhatsApp

### Additional Features
- Order cancellation functionality
- File preview and download
- Email notifications
- Order history pagination
- Search and filtering in admin dashboard

## Development Notes

- The application uses simulated data for demonstration
- File uploads are currently handled as placeholders
- Admin authentication is basic (hardcoded credentials)
- Database operations are ready but need real data integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.