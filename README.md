# DarkSky Admin Application

A comprehensive administrative dashboard for managing DarkSky Percussion members, payments, and operations. Built with Next.js, TypeScript, and modern web technologies.

## 🎯 Overview

The DarkSky Admin App is a full-featured management system designed to streamline the administration of percussion ensembles. It provides tools for member management, payment tracking, financial reporting, and user access control.

## ✨ Features

### 👥 Member Management
- **Member Directory**: Complete member profiles with contact information, instruments, and sections
- **Member Import**: Bulk import capabilities with CSV support
- **Profile Management**: Detailed member information including legal names, parent contacts, and addresses
- **Section Organization**: Group members by instrument sections

### 💰 Financial Management
- **Payment Tracking**: Comprehensive payment history and status monitoring
- **Tuition Management**: Flexible tuition amounts with edit logging
- **Payment Schedules**: Automated payment scheduling and tracking
- **Financial Reports**: Detailed financial analytics and export capabilities
- **Manual Payments**: Direct payment entry for cash/check transactions

### 🔄 Payment Processing
- **Stripe Integration**: Automated payment import from Stripe
- **Payment Reconciliation**: Match and assign payments to members
- **Unassigned Payments**: Handle payments that need manual assignment
- **Payment Status Tracking**: Real-time payment status updates

### 📊 Dashboard & Analytics
- **Executive Dashboard**: High-level overview of organizational metrics
- **Financial Reports**: Collection rates, outstanding balances, and payment trends
- **Member Statistics**: Active members, payment status breakdowns
- **CSV Export**: Export data for external analysis

### 🔐 User Management & Security
- **Role-Based Access Control**: Admin, Director, and Member roles
- **Permission Management**: Granular permission system with checkbox controls
- **User Administration**: Create, modify, and deactivate user accounts
- **Session Management**: Secure authentication with NextAuth.js

### 🔗 Integrations
- **JotForm Integration**: Automated member registration from JotForm submissions
- **Stripe Payment Processing**: Real-time payment synchronization
- **CSV Import/Export**: Flexible data exchange capabilities

### ⚙️ Settings & Configuration
- **Season Management**: Multi-season support with data organization
- **System Settings**: Configurable application parameters
- **Integration Settings**: Manage third-party service connections

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animations and transitions
- **Headless UI**: Accessible UI components

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **NextAuth.js**: Authentication and session management
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database

### External Services
- **Stripe**: Payment processing
- **JotForm**: Member registration forms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Stripe account (for payment processing)
- JotForm account (for member registration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd darksky_admin_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://..."
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Stripe
   STRIPE_SECRET_KEY="sk_..."
   STRIPE_PUBLISHABLE_KEY="pk_..."
   
   # JotForm
   JOTFORM_API_KEY="your-jotform-api-key"
   ```

4. **Database Setup**
   ```bash
   # Generate database schema
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

5. **Run the application**

5. **Run the application**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main application pages
│   └── login/             # Authentication pages
├── components/            # Reusable React components
├── contexts/              # React context providers
├── db/                    # Database schema and types
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and configurations
└── types/                 # TypeScript type definitions
```

## 🔑 User Roles & Permissions

### Admin
- Full system access
- User management
- All financial operations
- System settings and integrations

### Director
- Member management
- Financial reports and payments
- Payment processing
- Limited administrative functions

### Member
- View own profile
- Basic system access

## 📊 Key Workflows

### Member Registration
1. Admin Users submit Jotform Integration API and select form for import
2. Jotform import processes data and creates Member profiles for each submission
4. Member profile updated with current tuition schedule and relevant season information

### Payment Processing
1. Stripe processes payments automatically
2. System imports payment data
3. Payments matched to members via reconciliation
4. Financial reports updated in real-time

### Financial Reporting
1. Real-time dashboard updates
2. Export financial data as CSV
3. Track collection rates and outstanding balances
4. Generate member payment status reports

## 🔧 Development

### Database Operations
```bash
# Generate new migration
npm run db:generate

# Push changes to database
npm run db:push

# Open database studio
npm run db:studio
```

### Building & Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🧪 Testing

The application includes comprehensive error handling and validation:
- API route validation
- Form input validation
- Permission checking
- Database constraint enforcement

## 🚀 Deployment

The application is designed to be deployed on platforms that support Next.js:
- Vercel (recommended)
- Netlify
- Railway
- Self-hosted with Docker

Ensure all environment variables are configured in your deployment environment.

## 📋 API Documentation

### Authentication
All API routes require authentication via NextAuth.js session tokens.

### Key Endpoints
- `GET/POST /api/members` - Member management
- `GET/PUT /api/users` - User administration
- `GET/POST /api/payments` - Payment operations
- `GET /api/dashboard/summary` - Dashboard analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🧊 Icebox - Future Enhancements

### 🏢 Multi-Tenant Organization System

**Vision**: Transform the application into a multi-tenant platform where multiple percussion organizations can operate independently while sharing the same infrastructure.

#### Key Features
- **Organization Isolation**: Complete data separation between different organizations
- **Multi-Organization User Access**: Users can belong to multiple organizations with different roles
- **Super Admin Dashboard**: Global management interface for system administrators
- **Organization-Specific Branding**: Custom logos, colors, and settings per organization
- **Independent Integrations**: Separate Stripe/JotForm configurations per organization

#### Technical Implementation
- **Database Schema**: Add `Organization` table with foreign keys on all data tables
- **URL Structure**: Implement `/org/[orgSlug]/dashboard/...` routing pattern
- **Row-Level Security**: Ensure complete data isolation at the database level
- **Context Management**: Organization-aware React context and state management
- **Migration Strategy**: Seamless upgrade path from single to multi-tenant

#### Use Cases
- **Multiple Ensembles**: Manage different percussion groups (youth, adult, competitive)
- **Regional Organizations**: Support multiple locations or chapters
- **White-Label Solution**: Offer the platform as a service to other percussion organizations
- **Franchise Management**: Central oversight with local autonomy

#### Benefits
- **Scalability**: Support unlimited organizations on single infrastructure
- **Resource Efficiency**: Shared hosting costs and maintenance
- **Feature Consistency**: All organizations benefit from new features simultaneously
- **Data Security**: Complete isolation prevents cross-organization data leaks

*Estimated Implementation Time: 8-10 weeks*
*Priority: Low (Future enhancement when scaling needs arise)*

### 📱 Mobile Application
- React Native mobile app for members and staff
- Offline-capable member directory
- Push notifications for payment reminders
- Mobile-optimized payment processing

### 🔗 Extended Integrations
- QuickBooks integration for comprehensive accounting
- Email marketing platform integration (Mailchimp, Constant Contact)
- Calendar integration for event and rehearsal management
- SMS notification system for urgent communications

---

## 📞 Support

For support, questions, or feature requests, please create an issue in the repository or contact the development team (party of one).

**Built with ❤️ for DarkSky Percussion**
