import { injectable } from 'inversify';
import type { CaptchaVerificationPort } from '../../application/ports/captcha-verification.port';

/** Stub: always returns true. Replace with real reCAPTCHA/hCaptcha adapter when needed. */
@injectable()
export class CaptchaVerificationStubService implements CaptchaVerificationPort {
  async verify(_token: string): Promise<boolean> {
    return true;
  }
}
