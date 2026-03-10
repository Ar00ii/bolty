import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  private get from() {
    const name = this.config.get<string>('SMTP_FROM_NAME', 'Bolty');
    const email = this.config.get<string>('SMTP_USER', 'noreply@bolty.app');
    return `"${name}" <${email}>`;
  }

  async send2FACode(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: `Your Bolty verification code: ${code}`,
        html: `
          <div style="font-family:monospace;background:#09090b;color:#fff;padding:32px;border-radius:12px;max-width:480px">
            <h2 style="color:#836EF9;margin:0 0 16px">Bolty — Verification Code</h2>
            <p style="color:#a1a1aa;margin:0 0 24px">Enter this code to complete your sign-in. It expires in 10 minutes.</p>
            <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:12px;color:#836EF9">
              ${code}
            </div>
            <p style="color:#52525b;font-size:12px;margin-top:24px">If you didn't request this, ignore this email. Never share this code.</p>
          </div>
        `,
      });
      this.logger.log(`2FA code sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send 2FA email to ${to}`, err);
      throw err;
    }
  }

  async sendEmailChangeConfirmation(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Confirm your new Bolty email address',
        html: `
          <div style="font-family:monospace;background:#09090b;color:#fff;padding:32px;border-radius:12px;max-width:480px">
            <h2 style="color:#836EF9;margin:0 0 16px">Bolty — Confirm Email Change</h2>
            <p style="color:#a1a1aa;margin:0 0 24px">Enter this code in Bolty to confirm your new email address. Expires in 15 minutes.</p>
            <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:12px;color:#836EF9">
              ${code}
            </div>
            <p style="color:#52525b;font-size:12px;margin-top:24px">If you didn't request this, your account may be compromised. Contact support immediately.</p>
          </div>
        `,
      });
      this.logger.log(`Email change code sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email change code to ${to}`, err);
      throw err;
    }
  }
}
