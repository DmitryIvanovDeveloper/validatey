import { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { mockResponses } from '../lib/mockData';

export function ProjectResponses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'partial'>('all');

  const responses = mockResponses.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ответы респондентов</h1>
          <p className="text-gray-600">Просмотр и анализ всех ответов</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          Экспорт Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по ответам..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="completed">Завершенные</option>
              <option value="partial">Частичные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responses Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Длительность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Ответы
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {responses.map(response => (
                <ResponseRow key={response.id} response={response} />
              ))}
            </tbody>
          </table>
        </div>

        {responses.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Ответы не найдены
          </div>
        )}
      </div>
    </div>
  );
}

function ResponseRow({ response }: { response: typeof mockResponses[0] }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    completed: { label: 'Завершено', class: 'bg-green-100 text-green-800' },
    partial: { label: 'Частично', class: 'bg-yellow-100 text-yellow-800' },
    abandoned: { label: 'Отменено', class: 'bg-red-100 text-red-800' },
  };

  const status = statusConfig[response.status];

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-6 py-4 text-gray-900 font-mono text-sm">
          {response.id}
        </td>
        <td className="px-6 py-4 text-gray-600 text-sm">
          {new Date(response.completedAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </td>
        <td className="px-6 py-4 text-gray-600 text-sm">
          {Math.floor(response.duration / 60)}:{String(response.duration % 60).padStart(2, '0')} мин
        </td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 text-xs font-medium rounded ${status.class}`}>
            {status.label}
          </span>
        </td>
        <td className="px-6 py-4 text-gray-600 text-sm">
          {Object.keys(response.answers).length} вопросов
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-gray-50">
            <div className="space-y-3">
              {Object.entries(response.answers).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">{key}</div>
                  <div className="text-gray-900">{String(value)}</div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
