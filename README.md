# AkPrints - Printing Service Application

A modern Next.js web application for a printing service that allows users to place and track orders, with an admin panel for order management.

## Features

### User Features
- **Hero Section**: Welcoming landing page with call-to-action buttons
- **Order Placement**: Complete form for submitting print jobs with file upload
- **Order Tracking**: Track existing orders using phone number and token ID
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Toast Notifications**: Beautiful, non-intrusive success/error notifications
- **Error Handling**: Clear error messages that guide users to fix issues

### Admin Features
- **Admin Login**: Secure authentication for administrators
- **Order Management**: View and update order statuses and payment statuses
- **User Verification**: Manage user verification queue via WhatsApp
- **Dashboard**: Comprehensive overview with real-time statistics
- **File Management**: Delete uploaded files to save server space
- **Real-time Data**: All data fetched from database, no mock data

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

2. **Environment setup**:
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env file if needed
   # Change ADMIN_PASSCODE to a secure passcode
   # Update DATABASE_URL if needed
   ```

3. **Database setup**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations (creates database and tables)
   npx prisma migrate dev --name init
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - User interface: http://localhost:3000
   - Admin login: http://localhost:3000/admin/login

### Admin Credentials
- **Admin Passcode**: Set in `.env` file (default: `admin123`)

### Production Deployment

Before deploying to production:

1. **Update environment variables**:
   - Change `ADMIN_PASSCODE` to a secure, unique passcode
   - Update `DATABASE_URL` if using a different database
   - Set `NODE_ENV=production`

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Test the production build**:
   ```bash
   npm start
   ```

4. **Deploy to Vercel/similar platforms**:
   - Connect your repository
   - Add environment variables
   - Deploy!

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./prisma/dev.db` |
| `ADMIN_PASSCODE` | Admin login passcode | `admin123` |
| `UPLOAD_DIR` | File upload directory | `public/uploads` |
| `NEXT_PUBLIC_ADMIN_WHATSAPP` | WhatsApp number for verification | `919412010234` |
| `NODE_ENV` | Environment (development/production) | `development` |

## API Endpoints

### User APIs
- `POST /api/orders` - Create a new order
- `GET /api/orders?phone=xxx&tokenId=xxx` - Get user orders  
- `PATCH /api/orders` - Update order status
- `POST /api/token` - Generate/rotate user token
- `POST /api/upload` - Upload files for an order
- `POST /api/orders/[id]/cancel` - Cancel an order
- `DELETE /api/orders/[id]/files/[fileName]` - Delete files from an order

### Admin APIs
- `POST /api/admin/session` - Admin login
- `DELETE /api/admin/session` - Admin logout
- `GET /api/admin/orders` - Get all orders with filters
- `PATCH /api/admin/orders` - Bulk update orders
- `GET /api/admin/users` - Get all users with verification status
- `PATCH /api/admin/users` - Bulk verify users
- `GET /api/admin/stats` - Get dashboard statistics

## Error Handling

The application includes comprehensive error handling:

- **Centralized Error Handler**: Standardized error responses with error codes
- **Input Validation**: Phone numbers, token IDs, page numbers, CUIDs
- **File Validation**: Extension, size, and type checking
- **Database Error Handling**: Graceful handling of Prisma errors
- **User-Friendly Messages**: Clear errors with suggestions for fixes

## Security Features

- **Input Sanitization**: All user inputs are validated and sanitized
- **Path Traversal Protection**: File operations prevent directory traversal
- **File Extension Validation**: Only allowed file types can be uploaded
- **Duplicate Prevention**: Prevents duplicate phone numbers and files
- **Size Limits**: Maximum file size and total upload limits

## Development Status

### ✅ Completed
- Error handling infrastructure
- Toast notification system  
- Admin dashboard with real APIs
- File upload/delete functionality
- User verification system
- Order tracking and management
- Payment flow integration

### 📝 Future Enhancements
- PDF page counting for accurate pricing
- WhatsApp API integration for automatic notifications
- Payment gateway integration (Razorpay, Stripe)
- Email notifications
- File preview and download
- Advanced search and filtering

## Deployment Checklist

- [x] Error handling implemented on all API routes
- [x] Toast notifications for user feedback
- [x] Admin dashboard connected to real APIs
- [x] File upload/delete functionality working
- [x] Database migrations complete
- [x] Environment variables configured
- [ ] Change default admin passcode to secure value
- [ ] Test all user flows end-to-end
- [ ] Verify file upload limits and permissions
- [ ] Deploy to production platform

## Known Limitations

- Uses SQLite for development (consider PostgreSQL for production)
- File uploads stored locally (consider Vercel Blob or AWS S3 for production)
- WhatsApp verification is manual (requires WhatsApp Business API for automation)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.