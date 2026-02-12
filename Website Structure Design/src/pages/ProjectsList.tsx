import { Link } from 'react-router';
import { Plus, MoreVertical, Users, TrendingUp, Calendar, LogOut } from 'lucide-react';
import { mockProjects, currentUser } from '../lib/mockData';
import { logout } from '../lib/auth';

export function ProjectsList() {
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Validatey</h1>
              <p className="text-sm text-gray-600">Валидация гипотез</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser.role === 'admin' && (
              <Link
                to="/admin/users"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Admin
              </Link>
            )}
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full"
              />
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                <div className="text-xs text-gray-600">{currentUser.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Мои проекты</h2>
            <p className="text-gray-600">
              Управляйте проектами валидации гипотез
            </p>
          </div>
          <Link
            to="/projects/new"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Создать проект
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Всего проектов</span>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{mockProjects.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Активных</span>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {mockProjects.filter(p => p.status === 'active').length}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Завершенных</span>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {mockProjects.filter(p => p.status === 'completed').length}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Всего ответов</span>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {mockProjects.reduce((sum, p) => sum + p.responseCount, 0)}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>
    </div>
  );
}

function ProjectCard({ project }: { project: typeof mockProjects[0] }) {
  const progress = Math.round((project.responseCount / project.targetResponses) * 100);

  return (
    <Link
      to={`/projects/${project.id}`}
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all p-6 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          project.status === 'active' ? 'bg-green-100 text-green-800' :
          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {project.status}
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
        {project.name}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {project.segment}
      </p>

      <div className="space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Прогресс</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{project.responseCount}/{project.targetResponses}</span>
          </div>
          {project.verdict && (
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              project.verdict === 'GO' ? 'bg-green-100 text-green-800' :
              project.verdict === 'NO-GO' ? 'bg-red-100 text-red-800' :
              project.verdict === 'PIVOT' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.verdict}
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
          <Calendar className="w-4 h-4" />
          <span>Обновлен {new Date(project.updatedAt).toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    </Link>
  );
}
