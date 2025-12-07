export class CsrfValidator {
  private static token: string | null = null;

  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return this.token;
  }

  static getToken(): string | null {
    return this.token;
  }

  static validate(token: string): boolean {
    return this.token !== null && this.token === token;
  }

  static clear(): void {
    this.token = null;
  }
}


