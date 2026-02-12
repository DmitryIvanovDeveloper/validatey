import { Link } from 'react-router';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Страница не найдена</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
