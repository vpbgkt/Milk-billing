# 🥛 MilkMan: Milk Delivery & Tracking Platform

A comprehensive full-stack web application for tracking milk delivery and consumption with supplier management capabilities.

## 🎯 Project Goals

- Allow **regular users** to track their daily milk consumption visually
- Enable **milk suppliers** to manage deliveries, confirm/reject entries, and generate billing easily
- Provide **visual, intuitive representations** of milk consumption data
- Facilitate easy conversion from website to Android application

## 🚀 Features

### SuperAdmin Management (Platform Owner)
- **Complete Platform Control**: Full oversight of the entire MilkMan ecosystem
- **Supplier Management**: Add, suspend, remove suppliers with detailed analytics
- **User Oversight**: Monitor all users across all suppliers with filtering options
- **Platform Analytics**: Real-time dashboard with user metrics, revenue tracking, and growth analytics
- **System Configuration**: Manage platform settings, pricing, features, and integrations
- **Financial Overview**: Commission tracking, revenue analytics, and financial reporting
- **Content Management**: Update terms, policies, announcements, and platform branding
- **Security Management**: User suspension, account management, and activity monitoring

### User Management & Authentication
- Separate registration/login flows for users and suppliers
- Secure JWT authentication
- Password reset via email
- Profile management

### Milk Consumption Tracking
- Interactive milk jug visualization (empty/half/full)
- Daily tracking with real-time updates
- Monthly consumption summaries
- Pending entry submissions for supplier approval

### Supplier Management
- User invitation system with access codes
- Daily delivery quantity tracking
- Pending entry approval/rejection
- Automatic bill generation
- WhatsApp/web link bill sharing
- Offline user management
- Comprehensive reporting (PDF/Excel)

## 💻 Technology Stack

### Frontend
- **Next.js** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API calls
- Responsive design for mobile compatibility

### Backend
- **Node.js** with **Express.js**
- **JWT** authentication
- **MongoDB Atlas** with Mongoose ODM
- Input validation and security middleware

### Deployment & Infrastructure
- **AWS EC2** (Ubuntu)
- **Nginx** reverse proxy
- **PM2** process management
- **SSL** certificates (Let's Encrypt)

### Integrations
- **Twilio WhatsApp API** for notifications
- **Nodemailer/SendGrid** for email services

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/milkman.git
cd milkman
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Install backend dependencies
```bash
cd ../backend
npm install
```

4. Setup environment variables
```bash
# Copy example env files and fill in your values
cp .env.example .env
```

5. Start development servers
```bash
# Frontend (runs on http://localhost:3000)
cd frontend
npm run dev

# Backend (runs on http://localhost:5000)
cd backend
npm run dev
```

## 📁 Project Structure

```
milkman/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
├── docs/             # Project documentation
├── deployment/       # Deployment scripts and configs
└── mobile/           # Mobile app (Capacitor.js)
```

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/password-reset` - Password reset

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/history` - Get consumption history

### Milk Tracking
- `POST /api/milk/add-entry` - Add milk entry
- `GET /api/milk/get-monthly-data` - Get monthly data
- `GET /api/milk/pending-entries` - Get pending entries

### Supplier Management
- `POST /api/supplier/invite-user` - Invite new user
- `PUT /api/supplier/confirm-entry` - Confirm pending entry
- `POST /api/supplier/generate-bill` - Generate monthly bill

### SuperAdmin Management
- `GET /api/superadmin/analytics` - Get platform analytics
- `GET /api/superadmin/suppliers` - Get all suppliers with stats
- `GET /api/superadmin/users` - Get all users with filtering
- `PUT /api/superadmin/users/:id/suspend` - Suspend/unsuspend users
- `DELETE /api/superadmin/users/:id` - Delete user or supplier
- `POST /api/superadmin/suppliers` - Create new supplier
- `PUT /api/superadmin/settings` - Update platform settings

## 📱 Mobile App

The web application can be converted to an Android app using:
- **Capacitor.js** for native app wrapper
- **Progressive Web App (PWA)** features
- **Firebase Cloud Messaging** for push notifications

## 🚀 Deployment

The application is designed to be deployed on:
- **AWS EC2** for backend API
- **Vercel/Netlify** for frontend (alternative)
- **MongoDB Atlas** for database
- **GitHub Actions** for CI/CD

## 📋 Development Timeline

- **Phase 1**: Project Setup (1 week)
- **Phase 2**: Backend Development (2-3 weeks)
- **Phase 3**: Frontend Development (2 weeks)
- **Phase 4**: Integration & Testing (1 week)
- **Phase 5**: Mobile Conversion (1 week)
- **Phase 6**: Deployment (1 week)

**Total Duration**: 8-10 weeks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions and support, please contact [your-email@example.com]

## 🔮 Future Enhancements

- Push notifications
- Payment gateway integration
- AI-based analytics
- Loyalty/reward system
