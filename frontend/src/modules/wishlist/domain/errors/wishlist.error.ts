export class WishlistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WishlistError';
  }
}

export class EmailAlreadyExistsError extends WishlistError {
  constructor(email: string) {
    super(`Email ${email} is already in the wishlist`);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidEmailError extends WishlistError {
  constructor(email: string) {
    super(`Invalid email address: ${email}`);
    this.name = 'InvalidEmailError';
  }
}
