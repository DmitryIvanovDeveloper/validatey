import { useParams } from 'react-router';
import { TrendingUp, Clock, Target, CheckCircle } from 'lucide-react';
import { mockProjects } from '../lib/mockData';

export function ProjectProgress() {
  const { id } = useParams();
  const project = mockProjects.find(p => p.id === id);

  if (!project) return <div>Проект не найден</div>;

  const progress = Math.round((project.responseCount / project.targetResponses) * 100);
  const daysActive = Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const estimatedCompletion = Math.ceil((project.targetResponses - project.responseCount) / Math.max(project.responseCount / daysActive, 1));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Прогресс проекта</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Target}
          label="Прогресс"
          value={`${progress}%`}
          subtitle={`${project.responseCount}/${project.targetResponses}`}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Темп"
          value={`${Math.round(project.responseCount / daysActive)}/день`}
          subtitle="Средняя скорость"
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Дней активен"
          value={daysActive}
          subtitle="С момента запуска"
          color="purple"
        />
        <StatCard
          icon={Target}
          label="До завершения"
          value={`~${estimatedCompletion}д`}
          subtitle="Прогноз"
          color="orange"
        />
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Timeline развития</h2>
        
        <div className="space-y-4">
          <TimelineEvent
            date="2025-01-15"
            title="Проект создан"
            description="Начало валидации гипотезы"
            completed
          />
          <TimelineEvent
            date="2025-01-20"
            title="Первые приглашения отправлены"
            description="100 персональных email приглашений"
            completed
          />
          <TimelineEvent
            date="2025-02-01"
            title="Достигнут порог 25%"
            description="Получены первые ранние сигналы"
            completed
          />
          <TimelineEvent
            date="2025-02-10"
            title="67% ответов собрано"
            description="Активный сбор данных"
            completed
            current
          />
          <TimelineEvent
            date="Прогноз: 2025-02-18"
            title="Достижение 100% цели"
            description="Завершение сбора данных"
            completed={false}
          />
          <TimelineEvent
            date="После завершения"
            title="Финальный отчет и решение"
            description="GO/NO-GO вердикт"
            completed={false}
          />
        </div>
      </div>

      {/* Response Rate Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Динамика ответов</h2>
        
        <div className="h-64 flex items-end gap-2">
          {[5, 8, 12, 7, 10, 15, 10].map((value, index) => {
            const maxValue = 15;
            const height = (value / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                  style={{ height: `${height}%` }}
                  title={`${value} ответов`}
                />
                <span className="text-xs text-gray-600">
                  {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ключевые вехи</h2>
        
        <div className="space-y-3">
          <MilestoneCard
            percentage={25}
            title="Ранние сигналы"
            description="Первые индикаторы валидности гипотезы"
            completed={project.responseCount >= project.targetResponses * 0.25}
          />
          <MilestoneCard
            percentage={50}
            title="Промежуточный анализ"
            description="Достаточно данных для первых выводов"
            completed={project.responseCount >= project.targetResponses * 0.5}
          />
          <MilestoneCard
            percentage={75}
            title="Подготовка решения"
            description="Формирование финальных рекомендаций"
            completed={project.responseCount >= project.targetResponses * 0.75}
          />
          <MilestoneCard
            percentage={100}
            title="GO/NO-GO решение"
            description="Финальный вердикт по гипотезе"
            completed={project.responseCount >= project.targetResponses}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color }: any) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color as keyof typeof colors]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function TimelineEvent({ date, title, description, completed, current }: any) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          current ? 'bg-blue-600 ring-4 ring-blue-100' :
          completed ? 'bg-green-600' : 'bg-gray-200'
        }`}>
          {completed && <CheckCircle className="w-5 h-5 text-white" />}
        </div>
        <div className={`w-0.5 h-12 ${completed ? 'bg-green-600' : 'bg-gray-200'}`} />
      </div>
      <div className="flex-1 pb-12">
        <div className="text-sm text-gray-600 mb-1">{date}</div>
        <div className={`font-bold mb-1 ${current ? 'text-blue-600' : 'text-gray-900'}`}>
          {title}
        </div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  );
}

function MilestoneCard({ percentage, title, description, completed }: any) {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      completed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
          completed ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {percentage}%
        </div>
        <div className="flex-1">
          <div className={`font-bold mb-1 ${completed ? 'text-green-900' : 'text-gray-900'}`}>
            {title}
          </div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>
        {completed && <CheckCircle className="w-6 h-6 text-green-600" />}
      </div>
    </div>
  );
}
