export class TokenValidator {
  static isValid(token: string): boolean {
    if (!token || token.trim().length === 0) {
      return false;
    }
    // Basic validation - token should be alphanumeric with dashes/underscores
    return /^[a-zA-Z0-9_-]+$/.test(token);
  }

  static isExpired(token: string, expirationDate: Date): boolean {
    return new Date() > expirationDate;
  }
}

