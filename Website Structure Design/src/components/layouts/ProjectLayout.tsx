import { Outlet, useParams, Link, useLocation } from 'react-router';
import { ArrowLeft, Settings } from 'lucide-react';
import { mockProjects } from '../../lib/mockData';

export function ProjectLayout() {
  const { id } = useParams();
  const location = useLocation();
  const project = mockProjects.find(p => p.id === id);

  if (!project) {
    return <div className="p-8">Проект не найден</div>;
  }

  const tabs = [
    { path: `/projects/${id}`, label: 'Overview' },
    { path: `/projects/${id}/research`, label: 'Research' },
    { path: `/projects/${id}/report`, label: 'Report' },
    { path: `/projects/${id}/invitations`, label: 'Invitations' },
  ];

  const isActiveTab = (path: string) => {
    if (path === `/projects/${id}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

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
              <span>Все проекты</span>
            </Link>
            <Link
              to={`/projects/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-4 h-4" />
              <span>Настройки</span>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.name}</h1>
              <p className="text-gray-600">{project.segment}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                project.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </div>
              {project.verdict && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.verdict === 'GO' ? 'bg-green-100 text-green-800' :
                  project.verdict === 'NO-GO' ? 'bg-red-100 text-red-800' :
                  project.verdict === 'PIVOT' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.verdict}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 mt-6 -mb-px">
            {tabs.map(tab => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  isActiveTab(tab.path)
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            ))}
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
