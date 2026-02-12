import { Outlet, Link, useLocation } from 'react-router';
import { Users, MessageSquare, ArrowLeft } from 'lucide-react';

export function AdminLayout() {
  const location = useLocation();

  const tabs = [
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/projects"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>К проектам</span>
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Администрирование</h1>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    location.pathname === tab.path
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
