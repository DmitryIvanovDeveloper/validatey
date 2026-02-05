/**
 * Verifies CAPTCHA token (e.g. reCAPTCHA v3, hCaptcha).
 * Implemented in infrastructure; stub returns true until real provider is wired.
 */
export interface CaptchaVerificationPort {
  verify(token: string): Promise<boolean>;
}
