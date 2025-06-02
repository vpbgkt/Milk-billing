const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Configure email transporter based on environment
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      // For development, use Ethereal Email (test email service)
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
        console.log('Creating test email account for development...');
        const testAccount = await nodemailer.createTestAccount();
        
        emailConfig.host = 'smtp.ethereal.email';
        emailConfig.port = 587;
        emailConfig.secure = false;
        emailConfig.auth = {
          user: testAccount.user,
          pass: testAccount.pass
        };
        
        console.log('Test email credentials:', {
          user: testAccount.user,
          pass: testAccount.pass,
          preview: 'https://ethereal.email'
        });
      }

      this.transporter = nodemailer.createTransporter(emailConfig);

      // Verify connection
      await this.transporter.verify();
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error.message);
      this.transporter = null;
    }
  }

  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'MilkMan'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.stripHtml(html),
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log preview URL for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Email sent successfully');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  // Notification-specific email methods
  async sendNotificationEmail(user, notification) {
    const subject = `${process.env.APP_NAME || 'MilkMan'} - ${notification.title}`;
    
    const html = this.generateNotificationEmailTemplate(user, notification);
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  async sendWelcomeEmail(user) {
    const subject = `Welcome to ${process.env.APP_NAME || 'MilkMan'}!`;
    
    const html = this.generateWelcomeEmailTemplate(user);
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const subject = `${process.env.APP_NAME || 'MilkMan'} - Password Reset`;
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = this.generatePasswordResetEmailTemplate(user, resetUrl);
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  async sendBillingSummaryEmail(user, billingData) {
    const subject = `${process.env.APP_NAME || 'MilkMan'} - Monthly Billing Summary`;
    
    const html = this.generateBillingSummaryEmailTemplate(user, billingData);
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  async sendDeliveryConfirmationEmail(user, deliveryData) {
    const subject = `${process.env.APP_NAME || 'MilkMan'} - Delivery Confirmation`;
    
    const html = this.generateDeliveryConfirmationEmailTemplate(user, deliveryData);
    
    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  // Email template generators
  generateNotificationEmailTemplate(user, notification) {
    const priorityColors = {
      urgent: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#3b82f6'
    };

    const priorityColor = priorityColors[notification.priority] || '#3b82f6';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${process.env.APP_NAME || 'MilkMan'}</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid ${priorityColor};">
          <h2 style="color: ${priorityColor}; margin: 0 0 10px 0;">${notification.title}</h2>
          <p style="margin: 0; font-size: 16px;">${notification.message}</p>
          
          ${notification.actionUrl ? `
            <div style="margin: 20px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL}${notification.actionUrl}" 
                 style="background: ${priorityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Details
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message from ${process.env.APP_NAME || 'MilkMan'}. 
            <a href="${process.env.FRONTEND_URL}/dashboard/notifications" style="color: #007bff;">Manage your notification preferences</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeEmailTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${process.env.APP_NAME || 'MilkMan'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px;">Welcome to ${process.env.APP_NAME || 'MilkMan'}!</h1>
          <p style="margin: 0; font-size: 18px; opacity: 0.9;">Your dairy management journey starts here</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; margin: 20px 0;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${user.name}!</h2>
          
          <p>Thank you for joining ${process.env.APP_NAME || 'MilkMan'}. We're excited to help you manage your dairy needs efficiently.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #667eea;">Getting Started:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Set up your delivery preferences</li>
              <li>Connect with local suppliers</li>
              <li>Track your milk deliveries</li>
              <li>Manage your billing and payments</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6c757d;">
            If you have any questions, feel free to contact our support team. We're here to help!
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
          <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'MilkMan'}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordResetEmailTemplate(user, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${process.env.APP_NAME || 'MilkMan'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc3545; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <h2 style="margin: 0 0 20px 0;">Hello ${user.name},</h2>
          
          <p>We received a request to reset your password for your ${process.env.APP_NAME || 'MilkMan'} account.</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Your Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6c757d;">
            This link will expire in 1 hour for security reasons. If you need to reset your password after that, please request a new reset link.
          </p>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #6c757d;">
            If the button doesn't work, copy and paste this link: <br>
            <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  generateBillingSummaryEmailTemplate(user, billingData) {
    const { totalAmount, period, entries, dueDate } = billingData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Billing Summary - ${process.env.APP_NAME || 'MilkMan'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Monthly Billing Summary</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${period}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <h2 style="margin: 0 0 20px 0;">Hello ${user.name},</h2>
          
          <p>Here's your billing summary for ${period}:</p>
          
          <div style="background: white; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #28a745; font-size: 24px;">Total Amount Due</h3>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #333;">₹${totalAmount}</p>
            <p style="margin: 10px 0 0 0; color: #6c757d;">Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 15px 0; color: #333;">Delivery Summary:</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6;">Date</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">Amount</th>
              </tr>
              ${entries.map(entry => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #f1f3f4;">${new Date(entry.date).toLocaleDateString()}</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #f1f3f4;">${entry.quantity}L</td>
                  <td style="padding: 8px; text-align: right; border-bottom: 1px solid #f1f3f4;">₹${entry.totalAmount}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/billing" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Full Bill & Pay
            </a>
          </div>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #6c757d;">
            Questions about your bill? Contact us at support@milkman.com
          </p>
        </div>
      </body>
      </html>
    `;
  }

  generateDeliveryConfirmationEmailTemplate(user, deliveryData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delivery Confirmation - ${process.env.APP_NAME || 'MilkMan'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Delivery Confirmed!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px;">
          <h2 style="margin: 0 0 20px 0;">Hello ${user.name},</h2>
          
          <p>Your milk delivery has been successfully completed!</p>
          
          <div style="background: white; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
            <h4 style="margin: 0 0 15px 0; color: #28a745;">Delivery Details:</h4>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(deliveryData.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Quantity:</strong> ${deliveryData.quantity} liters</p>
            <p style="margin: 5px 0;"><strong>Rate:</strong> ₹${deliveryData.price} per liter</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${deliveryData.totalAmount}</p>
            ${deliveryData.supplier ? `<p style="margin: 5px 0;"><strong>Supplier:</strong> ${deliveryData.supplier.name}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #6c757d;">
            Thank you for using ${process.env.APP_NAME || 'MilkMan'}!
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Helper method to strip HTML tags for plain text version
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Test email functionality
  async sendTestEmail(to) {
    const subject = `${process.env.APP_NAME || 'MilkMan'} - Test Email`;
    const html = `
      <h2>Email Service Test</h2>
      <p>This is a test email to verify that the email service is working correctly.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `;

    return await this.sendEmail({ to, subject, html });
  }
}

module.exports = new EmailService();
