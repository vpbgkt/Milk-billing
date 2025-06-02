# MilkMan Platform - Notification System Testing Guide

## Overview

This comprehensive testing guide covers all aspects of the MilkMan notification system, including web push notifications, email notifications, and the complete user experience flow.

## Test Environment Setup

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`
- MongoDB database connection
- SMTP configuration for email testing
- VAPID keys configured for push notifications

### Environment Variables Required
```bash
# Backend (.env)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/milkman
JWT_SECRET=your-jwt-secret
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:admin@milkman.com

# Email Configuration (use Ethereal for testing)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-user
SMTP_PASS=your-ethereal-pass
SMTP_FROM=noreply@milkman.com

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

## Test Categories

### 1. Backend API Testing

#### Notification CRUD Operations
```bash
# Test notification creation
POST /api/notifications/test
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "title": "Test Notification",
  "message": "This is a test notification",
  "type": "info",
  "priority": "medium"
}
```

#### User Preferences Management
```bash
# Get user preferences
GET /api/notifications/preferences
Authorization: Bearer <your-jwt-token>

# Update preferences
PATCH /api/notifications/preferences
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "emailNotifications": true,
  "pushNotifications": true,
  "categories": {
    "milkDeliveries": true,
    "payments": true,
    "systemUpdates": false,
    "marketing": false
  }
}
```

#### Push Subscription Management
```bash
# Subscribe to push notifications
POST /api/notifications/subscribe
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "base64-encoded-key",
    "auth": "base64-encoded-auth"
  }
}
```

### 2. Frontend Integration Testing

#### Notification Context Testing
- [ ] Context loads user preferences on mount
- [ ] Context updates notification count correctly
- [ ] Context handles real-time notification updates
- [ ] Context manages loading states properly

#### Service Worker Testing
- [ ] Service worker registers successfully
- [ ] Push notifications display correctly
- [ ] Notification clicks navigate to correct URLs
- [ ] Background sync works when offline

#### UI Component Testing
- [ ] NotificationDropdown displays notifications correctly
- [ ] NotificationSettings saves preferences
- [ ] Mobile responsive design works properly
- [ ] Loading states display appropriately

### 3. End-to-End User Flow Testing

#### New User Registration Flow
1. **User Registration**
   - [ ] Welcome notification sent
   - [ ] Email notification sent
   - [ ] Default preferences created

2. **First Login**
   - [ ] Push notification permission requested
   - [ ] Service worker registered
   - [ ] Notification preferences accessible

3. **Preference Configuration**
   - [ ] User can enable/disable push notifications
   - [ ] User can enable/disable email notifications
   - [ ] User can configure quiet hours
   - [ ] User can set category preferences

#### Milk Entry Flow
1. **Entry Creation**
   - [ ] Supplier receives pending entry notification
   - [ ] User receives confirmation notification
   - [ ] Email sent if email notifications enabled

2. **Entry Confirmation**
   - [ ] User receives confirmation notification
   - [ ] Push notification displays with correct data
   - [ ] Email notification sent

3. **Entry Rejection**
   - [ ] User receives rejection notification
   - [ ] Reason displayed in notification
   - [ ] Appropriate priority level set

#### Billing Flow
1. **Bill Generation**
   - [ ] User receives bill generated notification
   - [ ] High priority notification for payment due
   - [ ] Email notification with bill details

2. **Payment Reminders**
   - [ ] Scheduled reminder notifications
   - [ ] Escalating priority as due date approaches
   - [ ] Urgent notifications for overdue bills

### 4. Mobile Responsiveness Testing

#### Device Testing Matrix
| Device Type | Screen Size | Browser | Status |
|-------------|-------------|---------|---------|
| iPhone 12 Pro | 390x844 | Safari | [ ] |
| iPhone SE | 375x667 | Safari | [ ] |
| Samsung Galaxy S21 | 360x800 | Chrome | [ ] |
| iPad Air | 820x1180 | Safari | [ ] |
| Desktop | 1920x1080 | Chrome | [ ] |
| Desktop | 1366x768 | Firefox | [ ] |

#### Mobile-Specific Tests
- [ ] Touch targets are at least 44px
- [ ] Notification dropdown is accessible on mobile
- [ ] Settings modal is usable on small screens
- [ ] Safe area insets respected on iOS
- [ ] Landscape mode works correctly

### 5. PWA Testing

#### Installation Testing
- [ ] App can be installed on home screen
- [ ] Manifest.json loads correctly
- [ ] App icons display properly
- [ ] Splash screen appears on launch

#### Offline Functionality
- [ ] App loads when offline
- [ ] Offline page displays when appropriate
- [ ] Service worker caches essential resources
- [ ] Background sync queues notifications

#### Push Notification Testing
- [ ] Notifications display when app is closed
- [ ] Notification actions work correctly
- [ ] Badge counts update appropriately
- [ ] Silent notifications don't disturb user

### 6. Performance Testing

#### Load Testing
- [ ] System handles 100 concurrent users
- [ ] Notification delivery within 5 seconds
- [ ] API response times under 200ms
- [ ] Database queries optimized

#### Memory Testing
- [ ] No memory leaks in notification context
- [ ] Service worker memory usage acceptable
- [ ] Notification list pagination works
- [ ] Large notification volumes handled

### 7. Security Testing

#### Authentication Testing
- [ ] Unauthorized users cannot access notifications
- [ ] JWT tokens validated properly
- [ ] Push subscriptions tied to authenticated users
- [ ] CORS policies properly configured

#### Data Privacy Testing
- [ ] Notification content encrypted in transit
- [ ] User preferences private to user
- [ ] Push tokens stored securely
- [ ] Email addresses not exposed

### 8. Email Integration Testing

#### SMTP Configuration
- [ ] SMTP connection established successfully
- [ ] Email templates render correctly
- [ ] Attachments work if applicable
- [ ] Bounce handling implemented

#### Email Content Testing
- [ ] Welcome email sent on registration
- [ ] Notification emails formatted properly
- [ ] Unsubscribe links work correctly
- [ ] Email preferences respected

### 9. Error Handling Testing

#### Network Failure Scenarios
- [ ] Graceful degradation when API unavailable
- [ ] Retry logic for failed push notifications
- [ ] Offline notification queuing
- [ ] User feedback for failed operations

#### Edge Cases
- [ ] Invalid push subscription handling
- [ ] Expired JWT token handling
- [ ] Malformed notification data handling
- [ ] Rate limiting behavior

### 10. Browser Compatibility Testing

#### Push Notification Support
| Browser | Version | Push Support | Status |
|---------|---------|--------------|---------|
| Chrome | 50+ | ✅ | [ ] |
| Firefox | 44+ | ✅ | [ ] |
| Safari | 16+ | ✅ | [ ] |
| Edge | 17+ | ✅ | [ ] |
| Opera | 39+ | ✅ | [ ] |

#### Feature Compatibility
- [ ] Service Worker registration
- [ ] Web Push API availability
- [ ] Notification API permissions
- [ ] LocalStorage accessibility

## Automated Testing Scripts

### Backend API Tests
```javascript
// tests/notifications.test.js
describe('Notification API', () => {
  test('should create notification', async () => {
    const response = await request(app)
      .post('/api/notifications/test')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test',
        message: 'Test message',
        type: 'info'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Frontend Component Tests
```javascript
// __tests__/NotificationDropdown.test.tsx
import { render, screen } from '@testing-library/react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

test('renders notification dropdown', () => {
  render(<NotificationDropdown />);
  const dropdown = screen.getByRole('button');
  expect(dropdown).toBeInTheDocument();
});
```

### E2E Tests with Playwright
```javascript
// e2e/notifications.spec.ts
import { test, expect } from '@playwright/test';

test('notification flow', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-testid="notification-bell"]');
  await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();
});
```

## Manual Testing Checklist

### Pre-Testing Setup
- [ ] Backend server running and accessible
- [ ] Frontend development server running
- [ ] Test user accounts created
- [ ] VAPID keys configured
- [ ] Email service configured

### Daily Testing Routine
- [ ] Smoke test: Create and receive notification
- [ ] Check notification dropdown functionality
- [ ] Verify email notifications sent
- [ ] Test mobile responsiveness
- [ ] Check browser console for errors

### Weekly Testing Routine
- [ ] Full regression test suite
- [ ] Performance benchmarking
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Security audit

## Test Data Management

### Test Users
```json
{
  "users": [
    {
      "email": "test.user@example.com",
      "password": "testpass123",
      "role": "customer",
      "notifications": true
    },
    {
      "email": "test.supplier@example.com",
      "password": "testpass123",
      "role": "supplier",
      "notifications": true
    }
  ]
}
```

### Test Notifications
```json
{
  "notifications": [
    {
      "type": "milk_delivery",
      "title": "Milk Delivered",
      "message": "Your daily milk delivery has arrived",
      "priority": "medium"
    },
    {
      "type": "payment",
      "title": "Payment Due",
      "message": "Your monthly bill is due in 3 days",
      "priority": "high"
    }
  ]
}
```

## Troubleshooting Guide

### Common Issues

#### Push Notifications Not Working
1. Check VAPID keys configuration
2. Verify service worker registration
3. Check browser permissions
4. Inspect network requests

#### Email Notifications Not Sent
1. Verify SMTP configuration
2. Check email service logs
3. Validate recipient email addresses
4. Review spam folder

#### Mobile Layout Issues
1. Test on actual devices
2. Check CSS media queries
3. Verify touch target sizes
4. Test in portrait/landscape modes

### Debug Tools
- Browser DevTools (Network, Application, Console)
- MongoDB Compass for database inspection
- Email testing tools (Ethereal Email, MailCatcher)
- Mobile device simulators

## Reporting

### Test Results Format
```markdown
## Test Execution Report - [Date]

### Summary
- Total Tests: X
- Passed: Y
- Failed: Z
- Skipped: W

### Failed Tests
1. Test Name: Description of failure
2. Test Name: Description of failure

### Performance Metrics
- Average API Response Time: Xms
- Notification Delivery Time: Xs
- Page Load Time: Xs

### Recommendations
- List of improvements needed
- Priority of fixes required
```

### Continuous Integration
- Automated tests run on every commit
- Performance benchmarks tracked over time
- Test coverage reports generated
- Failed tests block deployment

This comprehensive testing guide ensures the notification system works reliably across all platforms and use cases, providing users with a consistent and dependable experience.
