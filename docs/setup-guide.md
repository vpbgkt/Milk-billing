# MilkMan Project Setup Guide

## 🎯 Project Overview

MilkMan is a comprehensive milk delivery and tracking platform with three user roles:
- **SuperAdmin**: Platform owner with complete control
- **Suppliers**: Milk delivery businesses 
- **Users**: End customers tracking milk consumption

## 🏗️ Project Architecture

### Frontend (Next.js)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + useState/useReducer
- **HTTP Client**: Axios
- **Authentication**: JWT tokens stored in localStorage

### Backend (Express.js)
- **Framework**: Express.js with TypeScript support
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt password hashing
- **File Upload**: Multer middleware
- **Email**: Nodemailer integration
- **Notifications**: Twilio WhatsApp API

### Database Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'supplier' | 'superadmin',
  supplierId: ObjectId (for users),
  businessName: String (for suppliers),
  commission: Number (for suppliers),
  permissions: [String] (for superadmin),
  isActive: Boolean,
  isSuspended: Boolean,
  // ... other fields
}
```

#### Milk Entries Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  supplierId: ObjectId,
  date: Date,
  quantity: Number (0, 0.5, 1),
  status: 'confirmed' | 'pending' | 'rejected',
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Platform Settings Collection
```javascript
{
  _id: ObjectId,
  platformName: String,
  defaultCommission: Number,
  defaultMilkPrice: Number,
  maintenanceMode: Boolean,
  features: {
    enableNotifications: Boolean,
    enableBilling: Boolean,
    // ... other features
  },
  // ... other settings
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Git

### 1. Environment Setup

#### Backend Environment (.env)
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit with your values
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/milkman
JWT_SECRET=your-super-secret-jwt-key
SUPERADMIN_EMAIL=admin@yourdomain.com
SUPERADMIN_PASSWORD=SecurePassword123!
```

#### Frontend Environment (.env.local)
```bash
# Copy the example file
cp frontend/.env.local.example frontend/.env.local

# Edit with your values
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Installation

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Database Setup

```bash
# Seed the database with initial data
cd backend
npm run seed
```

This will create:
- **SuperAdmin**: admin@milkman.com / ChangeThisPassword123!
- **Sample Supplier**: supplier@milkman.com / supplier123
- **Sample User**: user@milkman.com / user123
- **Default platform settings**

### 4. Start Development Servers

```bash
# From project root - runs both frontend and backend
npm run dev

# Or run individually:
# Backend (http://localhost:5000)
cd backend && npm run dev

# Frontend (http://localhost:3000)
cd frontend && npm run dev
```

## 🔐 User Roles & Permissions

### SuperAdmin Features
- **Platform Analytics Dashboard**
  - Total users, suppliers, revenue
  - Registration trends and growth metrics
  - Platform health monitoring

- **User Management**
  - View all users across all suppliers
  - Suspend/unsuspend users and suppliers
  - Delete users and suppliers
  - Filter and search functionality

- **Supplier Management**
  - Create new suppliers
  - Monitor supplier performance
  - Manage supplier commissions
  - View supplier statistics

- **Platform Settings**
  - Configure platform-wide settings
  - Manage pricing and commission rates
  - Control feature availability
  - Branding and customization

- **Financial Overview**
  - Revenue tracking and analytics
  - Commission calculations
  - Financial reporting

### Supplier Features
- **User Management**
  - Invite users with access codes
  - Approve/reject user registrations
  - View connected users

- **Milk Delivery Tracking**
  - Record daily milk deliveries
  - Confirm/reject pending entries
  - View delivery history

- **Billing & Reports**
  - Generate monthly bills
  - Send bills via WhatsApp/email
  - Export reports (PDF/Excel)
  - Track payments

### User Features
- **Milk Consumption Tracking**
  - Visual milk jug interface
  - Daily consumption input
  - Monthly summary views

- **History & Analytics**
  - View consumption patterns
  - Monthly/yearly reports
  - Expense tracking

## 🛠️ Development Workflow

### Adding New Features

1. **Backend API Development**
   ```bash
   # Create new route file
   touch backend/routes/newfeature.js
   
   # Add route to server.js
   app.use('/api/newfeature', require('./routes/newfeature'));
   
   # Create controller if needed
   touch backend/controllers/newfeatureController.js
   ```

2. **Frontend Development**
   ```bash
   # Create new page/component
   touch frontend/src/app/newfeature/page.tsx
   
   # Add API service
   touch frontend/src/services/newfeatureService.ts
   ```

3. **Database Updates**
   ```bash
   # Create new model
   touch backend/models/NewModel.js
   
   # Update seeder if needed
   # Edit backend/utils/seeder.js
   ```

### Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests (when implemented)
cd frontend && npm test
```

## 📱 Mobile App Development

The platform is designed for easy mobile conversion:

1. **Progressive Web App (PWA)**
   - Service worker for offline functionality
   - App manifest for installability
   - Push notifications

2. **Capacitor.js Integration**
   ```bash
   # Install Capacitor
   npm install @capacitor/core @capacitor/cli
   
   # Initialize Capacitor
   npx cap init
   
   # Add Android platform
   npx cap add android
   
   # Build and sync
   npm run build
   npx cap sync
   ```

## 🚀 Deployment

### Backend Deployment (AWS EC2)

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/milkman.git
   cd milkman/backend
   
   # Install dependencies
   npm install --production
   
   # Set up environment
   cp .env.example .env
   # Edit .env with production values
   
   # Start with PM2
   pm2 start server.js --name "milkman-api"
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Build Configuration**
   ```json
   // package.json
   {
     "scripts": {
       "build": "next build",
       "start": "next start"
     }
   }
   ```

2. **Environment Variables**
   - Set production API URL
   - Configure deployment environment

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection**
   - Check MongoDB URI format
   - Verify network access in MongoDB Atlas
   - Ensure correct username/password

2. **CORS Errors**
   - Update FRONTEND_URL in backend .env
   - Check CORS configuration in server.js

3. **Authentication Issues**
   - Verify JWT secret consistency
   - Check token expiration settings

### Logs and Monitoring

```bash
# Backend logs (development)
cd backend && npm run dev

# Backend logs (production)
pm2 logs milkman-api

# Frontend logs
cd frontend && npm run dev
```

## 📞 Support

For technical support and questions:
- Create an issue on GitHub
- Email: support@milkman.com
- Documentation: [Wiki](link-to-wiki)

## 🔄 Version Control

```bash
# Development workflow
git checkout develop
git pull origin develop
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create pull request to develop
```

This setup guide provides everything needed to get the MilkMan platform running with full SuperAdmin functionality!
