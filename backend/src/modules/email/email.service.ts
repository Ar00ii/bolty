import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

// ── Shared email shell ─────────────────────────────────────────────────────

function shell(title: string, preheader: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;opacity:0;">${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;margin:0 auto;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="https://bolty.dev" style="text-decoration:none;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="background:#09090b;border-radius:10px;padding:8px 20px;">
                      <span style="color:#836EF9;font-size:22px;font-weight:700;letter-spacing:-0.5px;font-family:'Courier New',monospace;">Bolty</span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0 8px;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                You received this because an action was initiated on your Bolty account.<br/>
                If you didn't request this, you can safely ignore this email.
              </p>
              <p style="margin:10px 0 0;color:#d4d4d8;font-size:11px;">
                &copy; ${year} Bolty &middot; <a href="https://bolty.dev" style="color:#a1a1aa;text-decoration:none;">bolty.dev</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpBlock(code: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 20px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background:#fafafa;border:2px solid #e4e4e7;border-radius:14px;padding:20px 48px;">
            <span style="font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:800;letter-spacing:16px;color:#18181b;">${code}</span>
          </div>
        </td>
      </tr>
    </table>`;
}

function body(content: string): string {
  return `<div style="padding:36px 40px;">${content}</div>`;
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private from: string;
  private devMode: boolean;

  constructor(private readonly config: ConfigService) {
    const host    = config.get<string>('SMTP_HOST', '');
    const port    = config.get<number>('SMTP_PORT', 587);
    const user    = config.get<string>('SMTP_USER', '');
    const pass    = config.get<string>('SMTP_PASS', '');
    this.from     = config.get<string>('EMAIL_FROM', user ? `Bolty <${user}>` : 'Bolty <noreply@bolty.dev>');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.devMode = false;
      this.logger.log(`Email transport configured: ${host}:${port} (${user})`);
    } else {
      // Dev fallback: print emails to console instead of sending
      this.devMode = true;
      this.logger.warn(
        'SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing). ' +
        'Emails will be printed to the console. Set these vars to send real emails.',
      );
    }
  }

  private async send(to: string, subject: string, html: string, text: string): Promise<void> {
    if (this.devMode || !this.transporter) {
      // Print to console in dev so you can still see and use codes
      this.logger.log(
        `\n${'─'.repeat(60)}\n` +
        `[EMAIL - DEV MODE]\n` +
        `To:      ${to}\n` +
        `Subject: ${subject}\n` +
        `Body:\n${text}\n` +
        `${'─'.repeat(60)}`,
      );
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Email sent to ${to}: "${subject}" [${info.messageId}]`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      throw err;
    }
  }

  // ── Welcome ──────────────────────────────────────────────────────────────

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    const subject = 'Welcome to Bolty';
    const html = shell(subject, `Welcome to Bolty, ${username}!`, body(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Welcome to Bolty</h1>
      <p style="margin:0 0 20px;color:#71717a;font-size:15px;line-height:1.6;">
        Hi <strong style="color:#18181b;">@${username}</strong>, your account is ready.
        You're now part of the AI developer platform built for builders.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        <tr>
          <td style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:20px 24px;">
            <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
              <tr><td style="padding:6px 0;">
                <span style="color:#836EF9;font-size:15px;margin-right:10px;">&#10003;</span>
                <span style="color:#18181b;font-size:14px;font-weight:500;">Discover AI agents in the marketplace</span>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <span style="color:#836EF9;font-size:15px;margin-right:10px;">&#10003;</span>
                <span style="color:#18181b;font-size:14px;font-weight:500;">Publish your own bots and AI tools</span>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <span style="color:#836EF9;font-size:15px;margin-right:10px;">&#10003;</span>
                <span style="color:#18181b;font-size:14px;font-weight:500;">Link your GitHub and show your work</span>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>

      <a href="https://bolty.dev" style="display:inline-block;background:#836EF9;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;border-radius:10px;padding:12px 28px;">
        Start exploring &rarr;
      </a>
    `));
    const text = `Welcome to Bolty, @${username}!\n\nYour account is ready. Start exploring at https://bolty.dev`;
    await this.send(to, subject, html, text);
  }

  // ── 2FA login code ───────────────────────────────────────────────────────

  async send2FACode(to: string, code: string): Promise<void> {
    const subject = `${code} — your Bolty sign-in code`;
    const html = shell(subject, `Your Bolty sign-in code is ${code}`, body(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Two-Factor Sign-In</h1>
      <p style="margin:0 0 4px;color:#71717a;font-size:15px;line-height:1.6;">
        Enter this code to complete your Bolty sign-in.
        It expires in <strong style="color:#18181b;">10 minutes</strong>.
      </p>
      ${otpBlock(code)}
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          <strong>Never share this code.</strong> Bolty will never ask for it by phone or chat.
          If you didn't sign in, change your password immediately.
        </p>
      </div>
    `));
    const text = `Your Bolty 2FA sign-in code: ${code}\n\nExpires in 10 minutes. Never share it.`;
    await this.send(to, subject, html, text);
  }

  // ── Email change ─────────────────────────────────────────────────────────

  async sendEmailChangeConfirmation(to: string, code: string): Promise<void> {
    const subject = `${code} — confirm your new Bolty email`;
    const html = shell(subject, `Confirm your email change with code ${code}`, body(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Confirm Email Change</h1>
      <p style="margin:0 0 4px;color:#71717a;font-size:15px;line-height:1.6;">
        You requested to change your Bolty email to this address.
        Enter the code below to confirm. Expires in <strong style="color:#18181b;">15 minutes</strong>.
      </p>
      ${otpBlock(code)}
      <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#9f1239;">
          <strong>Didn't request this?</strong> Sign in and change your password immediately.
        </p>
      </div>
    `));
    const text = `Your Bolty email change code: ${code}\n\nExpires in 15 minutes.`;
    await this.send(to, subject, html, text);
  }

  // ── Password reset ───────────────────────────────────────────────────────

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = 'Reset your Bolty password';
    const html = shell(subject, 'Reset your Bolty password', body(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Password Reset</h1>
      <p style="margin:0 0 20px;color:#71717a;font-size:15px;line-height:1.6;">
        We received a request to reset your Bolty password.
        Click the button below to set a new one. The link expires in <strong style="color:#18181b;">15 minutes</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        <tr>
          <td align="center">
            <a href="${resetUrl}" style="display:inline-block;background:#836EF9;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;border-radius:10px;padding:14px 32px;">
              Reset password &rarr;
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px;color:#a1a1aa;font-size:13px;line-height:1.6;">
        Or copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color:#836EF9;word-break:break-all;">${resetUrl}</a>
      </p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          <strong>Didn't request a password reset?</strong> You can safely ignore this email — your password won't change.
        </p>
      </div>
    `));
    const text = `Reset your Bolty password\n\nClick the link below (expires in 15 minutes):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;
    await this.send(to, subject, html, text);
  }

  // ── Enable 2FA confirmation ───────────────────────────────────────────────

  async send2FAEnableCode(to: string, code: string): Promise<void> {
    const subject = `${code} — confirm two-factor authentication`;
    const html = shell(subject, `Confirm 2FA activation: ${code}`, body(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Enable Two-Factor Auth</h1>
      <p style="margin:0 0 4px;color:#71717a;font-size:15px;line-height:1.6;">
        You requested to enable two-factor authentication on your Bolty account.
        Enter this code to confirm. Expires in <strong style="color:#18181b;">10 minutes</strong>.
      </p>
      ${otpBlock(code)}
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#166534;">
          <strong>Didn't request this?</strong> Your account is safe — just ignore this email.
        </p>
      </div>
    `));
    const text = `Your Bolty 2FA activation code: ${code}\n\nExpires in 10 minutes.`;
    await this.send(to, subject, html, text);
  }

  // ── Delete account ───────────────────────────────────────────────────────

  async sendDeleteAccountCode(to: string, code: string): Promise<void> {
    const subject = `${code} — Bolty account deletion confirmation`;
    const html = shell(subject, `Confirm account deletion: ${code}`, body(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Account Deletion Request</h1>
      <p style="margin:0 0 4px;color:#71717a;font-size:15px;line-height:1.6;">
        You requested to permanently delete your Bolty account.
        Enter this code to confirm. This action <strong style="color:#18181b;">cannot be undone</strong>.
        Expires in <strong style="color:#18181b;">10 minutes</strong>.
      </p>
      ${otpBlock(code)}
      <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#9f1239;">
          <strong>This will permanently delete your account, all data, repositories and listings.</strong>
          If you didn't request this, change your password immediately.
        </p>
      </div>
    `));
    const text = `Your Bolty account deletion code: ${code}\n\nExpires in 10 minutes. This is PERMANENT.`;
    await this.send(to, subject, html, text);
  }
}
