import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

// ── Shared email shell ─────────────────────────────────────────────────────

function shell(title: string, preheader: string, body: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;opacity:0;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

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
                    <td style="background:#09090b;border-radius:10px;padding:8px 16px;">
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
                You received this email because an action was initiated on your Bolty account.<br/>
                If you didn't request this, you can safely ignore this email.
              </p>
              <p style="margin:10px 0 0;color:#d4d4d8;font-size:11px;">
                © ${year} Bolty · <a href="https://bolty.dev" style="color:#a1a1aa;text-decoration:none;">bolty.dev</a>
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
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background:#fafafa;border:2px solid #e4e4e7;border-radius:12px;padding:18px 40px;">
            <span style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:800;letter-spacing:14px;color:#18181b;">${code}</span>
          </div>
        </td>
      </tr>
    </table>`;
}

function bodySection(content: string): string {
  return `<div style="padding:36px 40px;">${content}</div>`;
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY', '');
    this.resend = new Resend(apiKey || 're_placeholder');
    // Use onboarding@resend.dev for testing (no domain verification needed)
    this.from = config.get<string>('EMAIL_FROM', 'Bolty <onboarding@resend.dev>');
  }

  private async send(to: string, subject: string, html: string, text: string): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({ from: this.from, to, subject, html, text });
      if (error) {
        this.logger.error(`Resend error to ${to}: ${JSON.stringify(error)}`);
        throw new Error(error.message);
      }
      this.logger.log(`Email sent to ${to}: "${subject}"`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
      throw err;
    }
  }

  // ── Welcome ──────────────────────────────────────────────────────────────

  async sendWelcomeEmail(to: string, username: string): Promise<void> {
    const subject = 'Welcome to Bolty 🚀';
    const html = shell(subject, `Welcome to Bolty, ${username}!`, bodySection(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Welcome to Bolty</h1>
      <p style="margin:0 0 20px;color:#71717a;font-size:15px;line-height:1.6;">Hi <strong style="color:#18181b;">@${username}</strong>, your account is ready. You're now part of the AI developer platform built for builders.</p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        <tr>
          <td style="background:#fafafa;border:1px solid #e4e4e7;border-radius:12px;padding:20px 24px;">
            <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
              <tr>
                <td style="padding:6px 0;">
                  <span style="color:#836EF9;font-size:16px;margin-right:10px;">✓</span>
                  <span style="color:#18181b;font-size:14px;font-weight:500;">Discover AI agents in the marketplace</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="color:#836EF9;font-size:16px;margin-right:10px;">✓</span>
                  <span style="color:#18181b;font-size:14px;font-weight:500;">Publish your own bots and AI tools</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;">
                  <span style="color:#836EF9;font-size:16px;margin-right:10px;">✓</span>
                  <span style="color:#18181b;font-size:14px;font-weight:500;">Link your GitHub and show your work</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <a href="https://bolty.dev" style="display:inline-block;background:#836EF9;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;border-radius:10px;padding:12px 28px;">
              Start exploring →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.6;">If you have questions, reply to this email — we're happy to help.</p>
    `));
    const text = `Welcome to Bolty, @${username}!\n\nYour account is ready. Start exploring at https://bolty.dev\n\nIf you didn't create this account, contact us immediately.`;
    await this.send(to, subject, html, text);
  }

  // ── 2FA login code ───────────────────────────────────────────────────────

  async send2FACode(to: string, code: string): Promise<void> {
    const subject = `${code} is your Bolty sign-in code`;
    const html = shell(subject, `Your Bolty sign-in code is ${code}`, bodySection(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Two-Factor Sign-In</h1>
      <p style="margin:0 0 4px;color:#71717a;font-size:15px;line-height:1.6;">Enter this code in Bolty to complete your sign-in. It expires in <strong style="color:#18181b;">10 minutes</strong>.</p>
      ${otpBlock(code)}
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-top:8px;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          <strong>⚠ Never share this code.</strong> Bolty will never ask for it by phone or chat. If you didn't sign in, change your password immediately.
        </p>
      </div>
    `));
    const text = `Your Bolty sign-in code is: ${code}\n\nThis code expires in 10 minutes. Never share it with anyone.`;
    await this.send(to, subject, html, text);
  }

  // ── Email change ─────────────────────────────────────────────────────────

  async sendEmailChangeConfirmation(to: string, code: string): Promise<void> {
    const subject = `Confirm your new Bolty email — code ${code}`;
    const html = shell(subject, `Confirm your email change with code ${code}`, bodySection(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Confirm Email Change</h1>
      <p style="margin:0 0 4px;color:#71717a;font-size:15px;line-height:1.6;">You requested to change your Bolty email address to this address. Enter the code below to confirm. Expires in <strong style="color:#18181b;">15 minutes</strong>.</p>
      ${otpBlock(code)}
      <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:14px 18px;margin-top:8px;">
        <p style="margin:0;font-size:13px;color:#9f1239;">
          <strong>Didn't request this?</strong> Your account may be at risk. Sign in and change your password immediately, or contact our support.
        </p>
      </div>
    `));
    const text = `Your Bolty email change confirmation code is: ${code}\n\nExpires in 15 minutes. If you didn't request this, secure your account immediately.`;
    await this.send(to, subject, html, text);
  }

  // ── Delete account ───────────────────────────────────────────────────────

  async sendDeleteAccountCode(to: string, code: string): Promise<void> {
    const subject = `${code} — Bolty account deletion confirmation`;
    const html = shell(subject, `Confirm account deletion with code ${code}`, bodySection(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b;letter-spacing:-0.5px;">Account Deletion Request</h1>
      <p style="margin:0 0 4px;color:#71717a;font-size:15px;line-height:1.6;">You requested to permanently delete your Bolty account. Enter this code to confirm. This action <strong style="color:#18181b;">cannot be undone</strong>. Expires in <strong style="color:#18181b;">10 minutes</strong>.</p>
      ${otpBlock(code)}
      <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:14px 18px;margin-top:8px;">
        <p style="margin:0;font-size:13px;color:#9f1239;">
          <strong>⚠ This will permanently delete your account, all your data, repositories, and marketplace listings.</strong> If you didn't request this, someone may have access to your account. Change your password immediately.
        </p>
      </div>
    `));
    const text = `Your Bolty account deletion code is: ${code}\n\nThis will PERMANENTLY delete your account and all data. Expires in 10 minutes.\n\nIf you didn't request this, change your password immediately.`;
    await this.send(to, subject, html, text);
  }
}
