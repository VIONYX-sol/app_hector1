# Venue Reservation Platform

A production-ready reservation platform for leisure venues and event spaces.

## Features

### Public Frontend
- Browse all venues with images and details
- View venue detail pages with capacity, location, and amenities
- Select available dates on a calendar
- Submit reservation requests with contact information
- Receive confirmation with reservation reference

### Admin CRM
- Secure login with httpOnly cookie-based sessions
- Dashboard with reservation statistics
- Manage reservations (view, confirm, reject, cancel)
- Manage venues (create, edit, archive)
- Block dates manually per venue
- View customer database

### Backend
- PostgreSQL database with proper schema
- RESTful API with validation
- Admin authentication with secure sessions
- Availability engine with overlap prevention
- Email notifications via Microsoft Graph
- Rate limiting and security headers

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Email**: Microsoft Graph API
- **Validation**: Joi + Zod

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- (Optional) Azure AD app registration for email notifications

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/venue-reservation.git
cd venue-reservation
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

### Database Setup

1. Create a PostgreSQL database:
```bash
createdb venue_reservations
```

2. Copy the backend environment file and configure:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and other settings
```

3. Run database migrations:
```bash
cd backend
npm run migrate
```

4. Create the first admin user:
```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepassword npm run seed
```

### Running Locally

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In another terminal, start the frontend:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

4. Access the admin panel at http://localhost:5173/admin/login

## Environment Variables

### Frontend (.env.local)

```env
VITE_API_BASE_URL=/api
```

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/venue_reservations

# Admin Setup (for seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_USERNAME=admin

# Microsoft Graph (optional)
MS_GRAPH_TENANT_ID=your-tenant-id
MS_GRAPH_CLIENT_ID=your-client-id
MS_GRAPH_CLIENT_SECRET=your-client-secret
MS_GRAPH_SENDER_EMAIL=notifications@yourdomain.com
NOTIFICATION_TO_EMAIL=owner@yourdomain.com
SEND_CUSTOMER_ACK_EMAIL=false
ADMIN_URL=https://yourdomain.com/admin
```

## API Endpoints

### Public API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/venues` | List all active venues |
| GET | `/api/public/venues/:slug` | Get venue details |
| GET | `/api/public/venues/:id/availability` | Get unavailable dates |
| POST | `/api/public/reservations` | Create reservation request |

### Admin API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/auth/login` | Admin login |
| POST | `/api/admin/auth/logout` | Admin logout |
| GET | `/api/admin/auth/me` | Get current admin |
| GET | `/api/admin/reservations` | List reservations |
| GET | `/api/admin/reservations/:id` | Get reservation details |
| PATCH | `/api/admin/reservations/:id` | Update reservation |
| GET | `/api/admin/venues` | List all venues |
| POST | `/api/admin/venues` | Create venue |
| PATCH | `/api/admin/venues/:id` | Update venue |
| DELETE | `/api/admin/venues/:id` | Archive venue |
| GET | `/api/admin/venues/:id/blocks` | Get venue blocks |
| POST | `/api/admin/venues/:id/blocks` | Create block |
| DELETE | `/api/admin/blocks/:id` | Delete block |
| GET | `/api/admin/customers` | List customers |

## Business Rules

### Availability Logic

- Dates are blocked when they have:
  - Pending reservations
  - Confirmed reservations
  - Owner-blocked dates
- Rejected and cancelled reservations do not block dates
- All bookings are full-day (inclusive date ranges)
- Business timezone: Europe/Madrid

### Reservation Statuses

| Status | Description | Blocks Availability |
|--------|-------------|---------------------|
| pending | Awaiting confirmation | Yes |
| confirmed | Confirmed by admin | Yes |
| rejected | Rejected by admin | No |
| cancelled | Cancelled | No |
| owner_blocked | Manual block | Yes |

## Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Azure App Service

1. Create an Azure Database for PostgreSQL
2. Create an Azure App Service (Node.js)
3. Configure environment variables in App Service settings
4. Deploy using GitHub Actions or Azure CLI

## Microsoft Graph Email Setup

1. Register an application in Azure AD
2. Add Mail.Send permission (Application type)
3. Grant admin consent
4. Create a client secret
5. Configure the environment variables in `.env`
6. Ensure the sender email has a mailbox in your Microsoft 365 tenant

## Scripts

```bash
# Frontend
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run linter

# Backend (from /backend)
npm run dev       # Start with nodemon
npm run start     # Start production
npm run migrate   # Run database migrations
npm run seed      # Create admin user
npm run test      # Run tests
```

## License

MIT
