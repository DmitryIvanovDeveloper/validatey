import type { AuthUser } from '../../../domain/entities/auth-user.entity';

export type GetCurrentSessionOutput = {
  user: AuthUser | null;
};

export type SignInWithGoogleInput = {
  redirectTo?: string;
};

export type SignInWithGoogleOutput = {
  redirectUrl: string;
};
