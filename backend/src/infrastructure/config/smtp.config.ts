/**
 * SMTP configuration from environment (infrastructure only).
 * Used by email adapter for Gmail / Outlook via Nodemailer.
 *
 * Env vars:
 *   SMTP_HOST    - e.g. smtp.gmail.com, smtp.office365.com
 *   SMTP_PORT    - 587 (TLS) or 465 (SSL)
 *   SMTP_SECURE  - true for 465, false for 587
 *   SMTP_USER    - login (email address)
 *   SMTP_PASS    - password or App Password
 *   SMTP_FROM    - optional; defaults to SMTP_USER
 */

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = getEnv('SMTP_HOST');
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');
  if (!host || !user || !pass) {
    return null;
  }
  const portRaw = getEnv('SMTP_PORT');
  const port = portRaw ? parseInt(portRaw, 10) : 587;
  const secureRaw = getEnv('SMTP_SECURE');
  const secure = secureRaw === 'true' || secureRaw === '1';
  const from = getEnv('SMTP_FROM') ?? user;
  return { host, port: Number.isFinite(port) ? port : 587, secure, user, pass, from };
}
