import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { handleOAuthCallback } from '../lib/auth';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        await handleOAuthCallback();
        // Redirect to projects page after successful auth
        navigate('/projects', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Обработка авторизации...</p>
      </div>
    </div>
  );
}
