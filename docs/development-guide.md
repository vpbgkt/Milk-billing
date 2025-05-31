# MilkMan Development Guide

## Getting Started

This document provides setup instructions and development guidelines for the MilkMan project.

## Project Structure

```
milkman/
├── frontend/          # Next.js frontend application
│   ├── components/    # Reusable React components
│   ├── pages/        # Next.js pages and API routes
│   ├── styles/       # CSS and Tailwind styles
│   ├── utils/        # Utility functions
│   └── hooks/        # Custom React hooks
├── backend/           # Express.js backend API
│   ├── controllers/   # Route controllers
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware
│   └── utils/        # Backend utilities
├── docs/             # Project documentation
├── deployment/       # Deployment scripts and configs
└── mobile/           # Mobile app (Capacitor.js)
```

## Environment Setup

### Required Environment Variables

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/milkman
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# AWS Configuration (for deployment)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
```

## Development Workflow

### 1. Feature Development
- Create feature branch from `develop`
- Implement feature with tests
- Submit PR to `develop` branch

### 2. Git Workflow
```bash
# Create feature branch
git checkout -b feature/milk-tracking

# Make changes and commit
git add .
git commit -m "feat: add milk tracking visualization"

# Push to remote
git push origin feature/milk-tracking

# Create pull request to develop branch
```

### 3. Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Write unit tests for components and API endpoints
- Use conventional commit messages

## API Design

### Authentication Flow
1. User registers/logs in
2. Server returns JWT token
3. Client stores token in localStorage
4. Include token in Authorization header for protected routes

### Error Handling
- Use consistent error response format
- Implement proper HTTP status codes
- Log errors for debugging

### Data Models

#### User Schema
```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  role: enum['user', 'supplier'],
  supplierId: ObjectId (if user),
  createdAt: Date,
  updatedAt: Date
}
```

#### Milk Entry Schema
```javascript
{
  userId: ObjectId,
  supplierId: ObjectId,
  date: Date,
  quantity: Number (0, 0.5, 1),
  status: enum['confirmed', 'pending', 'rejected'],
  createdAt: Date,
  updatedAt: Date
}
```

## Testing Strategy

### Frontend Testing
- Unit tests with Jest and React Testing Library
- Component integration tests
- E2E tests with Playwright/Cypress

### Backend Testing
- Unit tests with Jest
- API integration tests with Supertest
- Database tests with test database

## Deployment Pipeline

### Development
- Local development with hot reload
- MongoDB Atlas development cluster

### Staging
- Deploy to staging environment
- Run automated tests
- Manual QA testing

### Production
- Deploy to AWS EC2
- MongoDB Atlas production cluster
- SSL certificates and security hardening

## Mobile Development

### Capacitor.js Setup
1. Build web application
2. Initialize Capacitor project
3. Add Android platform
4. Build APK

### PWA Features
- Service worker for offline functionality
- App manifest for installation
- Push notifications (optional)

## Monitoring and Logging

### Backend Logging
- Use Winston for structured logging
- Log levels: error, warn, info, debug
- Centralized logging for production

### Performance Monitoring
- Monitor API response times
- Database query optimization
- Frontend bundle size optimization

## Security Considerations

### Authentication
- JWT token expiration
- Password hashing with bcrypt
- Rate limiting on auth endpoints

### Data Validation
- Input sanitization
- Schema validation with Joi
- XSS protection

### API Security
- CORS configuration
- Helmet for security headers
- Request size limits

## Troubleshooting

### Common Issues
1. **CORS errors**: Check CORS configuration in backend
2. **Database connection**: Verify MongoDB URI and network access
3. **Authentication failures**: Check JWT secret and token format
4. **Build failures**: Verify Node.js version and dependencies

For more detailed information, refer to individual component documentation in their respective directories.
