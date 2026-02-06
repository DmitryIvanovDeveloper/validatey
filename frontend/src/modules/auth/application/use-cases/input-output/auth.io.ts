import type { AuthUser } from '../../../domain/entities/auth-user.entity';
import type { AuthRole } from '../../ports/auth-service.port';

export type GetCurrentSessionOutput = {
  user: AuthUser | null;
  role: AuthRole | null;
};

export type SignInWithGoogleInput = {
  redirectTo?: string;
};

export type SignInWithGoogleOutput = {
  redirectUrl: string;
};

export type RegisterWithEmailInput = {
  email: string;
  password: string;
};

export type SignInWithEmailInput = {
  email: string;
  password: string;
};

export type EmailAuthOutput = {
  session: { user: AuthUser; role?: AuthRole };
  requiresEmailConfirmation?: boolean;
};
