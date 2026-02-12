import { useParams } from 'react-router';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Sparkles,
  Send,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { mockProjects } from '../lib/mockData';

export function ProjectOverview() {
  const { id } = useParams();
  const project = mockProjects.find(p => p.id === id);

  if (!project) return <div>Проект не найден</div>;

  const progress = Math.round((project.responseCount / project.targetResponses) * 100);
  const daysActive = Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h2>
            
            <div className="space-y-4">
              {project.verdict && (
                <div className={`p-4 rounded-lg border-2 ${
                  project.verdict === 'GO' 
                    ? 'bg-green-50 border-green-200' 
                    : project.verdict === 'NO-GO'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {project.verdict === 'GO' ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                    )}
                    <div>
                      <div className={`text-lg font-bold mb-1 ${
                        project.verdict === 'GO' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        AI Вердикт: {project.verdict}
                      </div>
                      <p className="text-gray-700">
                        {project.verdict === 'GO' 
                          ? 'Гипотеза подтверждена. Данные показывают сильный интерес целевой аудитории и готовность к использованию продукта.'
                          : project.verdict === 'NO-GO'
                          ? 'Гипотеза не подтверждена. Недостаточный интерес аудитории или несоответствие product-market fit.'
                          : 'Требуется дополнительная валидация. Сигналы неоднозначны.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 text-sm mb-1">Ключевой инсайт</div>
                  <div className="font-bold text-gray-900">
                    {project.responseCount > 50 ? '78% готовы платить' : 'Сбор данных...'}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 text-sm mb-1">Основной барьер</div>
                  <div className="font-bold text-gray-900">
                    {project.responseCount > 50 ? 'Цена выше ожиданий' : 'Анализ...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Pulse */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Pulse</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PulseCard
                icon={TrendingUp}
                label="Response Pace"
                value={`${Math.round(project.responseCount / Math.max(daysActive, 1))}/день`}
                status={project.responseCount / daysActive > 5 ? 'good' : 'normal'}
              />
              <PulseCard
                icon={MessageSquare}
                label="Data Depth"
                value="Высокая"
                status="good"
              />
              <PulseCard
                icon={Target}
                label="Coverage"
                value={`${progress}%`}
                status={progress > 70 ? 'good' : 'normal'}
              />
              <PulseCard
                icon={Clock}
                label="Time"
                value={`${daysActive}д`}
                status="normal"
              />
            </div>
          </div>

          {/* Research Context */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Research Context</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Целевой сегмент</div>
                <div className="text-gray-900">{project.segment}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Гипотеза</div>
                <div className="text-gray-900">{project.hypothesis}</div>
              </div>
              
              {project.assumptions.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Ключевые предположения</div>
                  <ul className="space-y-2">
                    {project.assumptions.map((assumption, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-900">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{assumption}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {project.marketContext && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">Контекст рынка</div>
                  <div className="text-gray-900">{project.marketContext}</div>
                </div>
              )}
            </div>
          </div>

          {/* Decision Pathway */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Decision Pathway</h2>
            
            <div className="space-y-3">
              <DecisionStep
                completed={project.responseCount >= project.targetResponses * 0.25}
                label="Соберите 25% ответов"
                description="Ранние сигналы о валидности гипотезы"
              />
              <DecisionStep
                completed={project.responseCount >= project.targetResponses * 0.5}
                label="Достигните 50% целевых ответов"
                description="Первые выводы и корректировка"
              />
              <DecisionStep
                completed={project.responseCount >= project.targetResponses * 0.75}
                label="75% - подготовка к решению"
                description="Анализ данных и формирование рекомендаций"
              />
              <DecisionStep
                completed={project.responseCount >= project.targetResponses}
                label="GO/NO-GO решение"
                description="Финальный вердикт на основе всех данных"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Smart Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Smart Actions</h2>
            
            <div className="space-y-2">
              <ActionButton
                icon={Send}
                label="Отправить напоминания"
                description="15 респондентов не завершили опрос"
              />
              <ActionButton
                icon={LinkIcon}
                label="Поделиться ссылкой"
                description="Увеличьте охват аудитории"
              />
              <ActionButton
                icon={Sparkles}
                label="AI рекомендации"
                description="Получите инсайты на основе данных"
              />
              <ActionButton
                icon={BarChart3}
                label="Экспорт отчета"
                description="PDF/Excel с результатами"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Статистика</h2>
            
            <div className="space-y-4">
              <StatItem
                label="Всего ответов"
                value={project.responseCount}
                total={project.targetResponses}
              />
              <StatItem
                label="Процент завершения"
                value={`${Math.round(project.responseCount / project.targetResponses * 85)}%`}
              />
              <StatItem
                label="Среднее время"
                value="3:42 мин"
              />
              <StatItem
                label="Активных респондентов"
                value="12"
              />
            </div>
          </div>

          {/* Learning Journey */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Learning Journey</h2>
            <p className="text-gray-700 text-sm mb-4">
              Это раунд валидации #1. После анализа результатов вы сможете запустить следующий раунд для углубленной проверки.
            </p>
            <button className="text-blue-600 font-medium text-sm hover:text-blue-700">
              Узнать больше →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PulseCard({ icon: Icon, label, value, status }: any) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <Icon className={`w-5 h-5 mb-2 ${
        status === 'good' ? 'text-green-600' : 'text-gray-600'
      }`} />
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="font-bold text-gray-900">{value}</div>
    </div>
  );
}

function DecisionStep({ completed, label, description }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        completed ? 'bg-green-600' : 'bg-gray-200'
      }`}>
        {completed && <CheckCircle className="w-4 h-4 text-white" />}
      </div>
      <div>
        <div className={`font-medium ${completed ? 'text-gray-900' : 'text-gray-600'}`}>
          {label}
        </div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, description }: any) {
  return (
    <button className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
      <Icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </button>
  );
}

function StatItem({ label, value, total }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="font-bold text-gray-900">
        {value}
        {total && <span className="text-gray-400">/{total}</span>}
      </span>
    </div>
  );
}
