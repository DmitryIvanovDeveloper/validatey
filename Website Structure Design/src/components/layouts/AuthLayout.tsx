import { Navigate, Outlet } from 'react-router';
import { isAuthenticated } from '../../lib/auth';

export function AuthLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
