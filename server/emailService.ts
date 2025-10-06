import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.setupTransporter();
  }

  private setupTransporter() {
    if (process.env.SMTP_HOST) {
      // Use configured SMTP (works in both development and production)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('✅ Email service configured with SMTP:', process.env.SMTP_HOST);
    } else {
      // Fallback for development without SMTP configured
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass',
        },
      });
      console.log('⚠️  Email service using fallback (emails will not be sent)');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const emailOptions: EmailOptions = {
      to: email,
      subject: 'Reset Your SAKA Password',
      html: this.getPasswordResetTemplate(resetUrl),
      text: `Reset your SAKA password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour.`,
    };

    try {
      if (process.env.SMTP_HOST) {
        // Send real email via configured SMTP
        const info = await this.transporter.sendMail({
          from: process.env.FROM_EMAIL || 'noreply@saka.com',
          ...emailOptions,
        });
        console.log('✅ Password reset email sent to:', emailOptions.to);
        console.log('   Message ID:', info.messageId);
        return true;
      } else {
        // Development fallback - log email details
        console.log('\n=== PASSWORD RESET EMAIL (NOT SENT) ===');
        console.log('To:', emailOptions.to);
        console.log('Subject:', emailOptions.subject);
        console.log('Reset URL:', resetUrl);
        console.log('=======================================\n');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your SAKA Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b35 0%, #d73027 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ SAKA</h1>
            <p>Reset Your Password</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password for your SAKA account.</p>
            <p>Click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>If you didn't request this password reset, please ignore this email.</strong></p>
          </div>
          <div class="footer">
            <p>SAKA - Discover African Heritage Through Interactive Adventures</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();