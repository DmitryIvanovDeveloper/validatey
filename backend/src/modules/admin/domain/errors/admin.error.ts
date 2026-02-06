/**
 * Thrown when a non-admin user attempts an admin-only action.
 */
export class AdminAccessDeniedError extends Error {
  constructor(public readonly userId: string) {
    super(`User ${userId} does not have admin access`);
    this.name = 'AdminAccessDeniedError';
    Object.setPrototypeOf(this, AdminAccessDeniedError.prototype);
  }
}
