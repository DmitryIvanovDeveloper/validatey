import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { mockProjects } from '../lib/mockData';

export function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find(p => p.id === id);

  const [formData, setFormData] = useState({
    name: project?.name || '',
    segment: project?.segment || '',
    hypothesis: project?.hypothesis || '',
    assumptions: project?.assumptions || ['', '', ''],
    marketContext: project?.marketContext || '',
    audienceSize: project?.audienceSize || 100,
    distributionMethod: project?.distributionMethod || 'email',
  });

  if (!project) return <div>Проект не найден</div>;

  const handleSave = () => {
    // Save logic here
    navigate(`/projects/${id}`);
  };

  const updateAssumption = (index: number, value: string) => {
    const newAssumptions = [...formData.assumptions];
    newAssumptions[index] = value;
    setFormData({ ...formData, assumptions: newAssumptions });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад к проекту</span>
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">Редактирование проекта</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Название проекта
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Целевой сегмент
            </label>
            <input
              type="text"
              value={formData.segment}
              onChange={e => setFormData({ ...formData, segment: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Гипотеза
            </label>
            <textarea
              value={formData.hypothesis}
              onChange={e => setFormData({ ...formData, hypothesis: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Ключевые предположения
            </label>
            {formData.assumptions.map((assumption, index) => (
              <input
                key={index}
                type="text"
                value={assumption}
                onChange={e => updateAssumption(index, e.target.value)}
                placeholder={`Предположение ${index + 1}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent mb-3"
              />
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Контекст рынка
            </label>
            <textarea
              value={formData.marketContext}
              onChange={e => setFormData({ ...formData, marketContext: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Целевое количество ответов
              </label>
              <input
                type="number"
                value={formData.audienceSize}
                onChange={e => setFormData({ ...formData, audienceSize: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Способ распространения
              </label>
              <select
                value={formData.distributionMethod}
                onChange={e => setFormData({ ...formData, distributionMethod: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="link">Публичная ссылка</option>
                <option value="mixed">Смешанный</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Сохранить изменения
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
