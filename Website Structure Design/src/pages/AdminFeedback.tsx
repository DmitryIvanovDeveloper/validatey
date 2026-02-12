import { useState } from 'react';
import { MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { mockFeedback, type Feedback } from '../lib/mockData';

export function AdminFeedback() {
  const [feedback] = useState(mockFeedback);
  const [filterType, setFilterType] = useState<'all' | 'bug' | 'feature' | 'general'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'reviewed' | 'resolved'>('all');

  const filteredFeedback = feedback.filter(f => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: feedback.length,
    new: feedback.filter(f => f.status === 'new').length,
    reviewed: feedback.filter(f => f.status === 'reviewed').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Обратная связь</h1>
        <p className="text-gray-600">Просмотр и обработка feedback от пользователей</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Всего</span>
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Новые</span>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.new}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">На рассмотрении</span>
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.reviewed}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Решено</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.resolved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="all">Все типы</option>
              <option value="bug">Баги</option>
              <option value="feature">Пожелания</option>
              <option value="general">Общее</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="new">Новые</option>
              <option value="reviewed">На рассмотрении</option>
              <option value="resolved">Решенные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.map(item => (
          <FeedbackCard key={item.id} feedback={item} />
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          Нет feedback по выбранным фильтрам
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const typeConfig = {
    bug: { label: 'Баг', class: 'bg-red-100 text-red-800', icon: AlertCircle },
    feature: { label: 'Пожелание', class: 'bg-blue-100 text-blue-800', icon: MessageSquare },
    general: { label: 'Общее', class: 'bg-gray-100 text-gray-800', icon: MessageSquare },
  };

  const statusConfig = {
    new: { label: 'Новый', class: 'bg-orange-100 text-orange-800' },
    reviewed: { label: 'Рассмотрен', class: 'bg-purple-100 text-purple-800' },
    resolved: { label: 'Решен', class: 'bg-green-100 text-green-800' },
  };

  const type = typeConfig[feedback.type];
  const status = statusConfig[feedback.status];
  const Icon = type.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-gray-400 mt-1" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${type.class}`}>
                {type.label}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${status.class}`}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-900">{feedback.message}</p>
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(feedback.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent">
          <option>Изменить статус</option>
          <option value="new">Новый</option>
          <option value="reviewed">Рассмотрен</option>
          <option value="resolved">Решен</option>
        </select>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Ответить
        </button>
      </div>
    </div>
  );
}
