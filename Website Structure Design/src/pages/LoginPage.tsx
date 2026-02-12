import { Navigate } from 'react-router';
import { Chrome } from 'lucide-react';
import { isAuthenticated, login } from '../lib/auth';

export function LoginPage() {
  if (isAuthenticated()) {
    return <Navigate to="/projects" replace />;
  }

  const handleGoogleLogin = async () => {
    await login('google');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">V</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Validatey</h1>
          <p className="text-gray-600">
            Платформа для валидации гипотез через опросы
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Войти в систему
          </h2>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <Chrome className="w-5 h-5" />
            Sign in with Google
          </button>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Нажимая "Sign in", вы соглашаетесь с условиями использования
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <span>✓ Быстрая валидация</span>
            <span>✓ AI-анализ</span>
            <span>✓ Умные инсайты</span>
          </div>
        </div>
      </div>
    </div>
  );
}
