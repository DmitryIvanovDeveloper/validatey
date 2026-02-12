import { BarChart3, TrendingUp, Users, AlertCircle, CheckCircle, Download } from 'lucide-react';

export function ProjectReport() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Отчет валидации</h1>
          <p className="text-gray-600">Детальный анализ результатов опроса</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          Экспорт PDF
        </button>
      </div>

      <div className="space-y-6">
        {/* Executive Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Вердикт: GO</h2>
              <p className="text-gray-700 text-lg">
                Гипотеза подтверждена. 78% респондентов заинтересованы в продукте и готовы платить за решение.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/80 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Уверенность</div>
              <div className="text-2xl font-bold text-green-600">87%</div>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Размер выборки</div>
              <div className="text-2xl font-bold text-gray-900">67</div>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Качество данных</div>
              <div className="text-2xl font-bold text-gray-900">Высокое</div>
            </div>
          </div>
        </div>

        {/* Key Findings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ключевые находки</h2>
          
          <div className="space-y-4">
            <FindingCard
              type="positive"
              title="Сильная потребность"
              description="78% респондентов активно ищут решение проблемы сейчас"
              impact="high"
            />
            <FindingCard
              type="positive"
              title="Готовность платить"
              description="Средняя готовность платить $67/мес, что выше планируемой цены ($49)"
              impact="high"
            />
            <FindingCard
              type="warning"
              title="Барьер: Интеграции"
              description="43% беспокоятся о сложности интеграции с текущими инструментами"
              impact="medium"
            />
            <FindingCard
              type="neutral"
              title="Feature приоритеты"
              description="Top-3: AI автоматизация (89%), Email интеграция (76%), Аналитика (71%)"
              impact="medium"
            />
          </div>
        </div>

        {/* Response Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Анализ ответов</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart placeholder */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Интерес к продукту</h3>
              <div className="space-y-3">
                <BarItem label="Очень заинтересован" value={52} color="green" />
                <BarItem label="Заинтересован" value={26} color="blue" />
                <BarItem label="Возможно" value={15} color="yellow" />
                <BarItem label="Не заинтересован" value={7} color="gray" />
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">Готовность платить</h3>
              <div className="space-y-3">
                <BarItem label="$50-79/мес" value={45} color="green" />
                <BarItem label="$30-49/мес" value={33} color="blue" />
                <BarItem label="< $30/мес" value={15} color="yellow" />
                <BarItem label="Не готов" value={7} color="gray" />
              </div>
            </div>
          </div>
        </div>

        {/* Early Signals */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ранние сигналы</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SignalCard
              icon={TrendingUp}
              label="Momentum"
              value="Высокий"
              description="Response rate 67% за 3 недели"
              positive
            />
            <SignalCard
              icon={Users}
              label="Engagement"
              value="82%"
              description="Среднее время прохождения 3:42 мин"
              positive
            />
            <SignalCard
              icon={BarChart3}
              label="Quality"
              value="89%"
              description="Детальных развернутых ответов"
              positive
            />
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Рекомендации</h2>
          
          <div className="space-y-4">
            <RecommendationCard
              priority="high"
              title="Двигаться к разработке MVP"
              description="Данные подтверждают product-market fit. Рекомендуем начать разработку минимальной версии с фокусом на core features."
            />
            <RecommendationCard
              priority="medium"
              title="Решить вопрос с интеграциями"
              description="43% респондентов обеспокоены интеграцией. Приоритезируйте API для популярных инструментов (Gmail, Slack, Zapier)."
            />
            <RecommendationCard
              priority="medium"
              title="Оптимизировать pricing"
              description="Текущая готовность платить выше планируемой цены. Рассмотрите $59/мес как optimal price point."
            />
            <RecommendationCard
              priority="low"
              title="Провести раунд #2 валидации"
              description="После MVP протестируйте UX и onboarding с фокус-группой из текущих респондентов."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FindingCard({ type, title, description, impact }: any) {
  const colors = {
    positive: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    neutral: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const icons = {
    positive: <CheckCircle className="w-5 h-5 text-green-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    neutral: <BarChart3 className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className={`p-4 border rounded-lg ${colors[type as keyof typeof colors]}`}>
      <div className="flex items-start gap-3">
        {icons[type as keyof typeof icons]}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold">{title}</h3>
            <span className={`px-2 py-0.5 text-xs rounded ${
              impact === 'high' ? 'bg-red-100 text-red-800' :
              impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {impact === 'high' ? 'Высокий impact' : impact === 'medium' ? 'Средний impact' : 'Низкий impact'}
            </span>
          </div>
          <p className="text-sm opacity-90">{description}</p>
        </div>
      </div>
    </div>
  );
}

function BarItem({ label, value, color }: any) {
  const colors = {
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colors[color as keyof typeof colors]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SignalCard({ icon: Icon, label, value, description, positive }: any) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      positive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <Icon className={`w-6 h-6 mb-2 ${positive ? 'text-green-600' : 'text-gray-600'}`} />
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-600">{description}</div>
    </div>
  );
}

function RecommendationCard({ priority, title, description }: any) {
  const colors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50',
  };

  const badges = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className={`p-4 border rounded-lg ${colors[priority as keyof typeof colors]}`}>
      <div className="flex items-start gap-3">
        <span className={`px-2 py-1 text-xs font-medium rounded ${badges[priority as keyof typeof badges]}`}>
          {priority === 'high' ? 'Высокий приоритет' : priority === 'medium' ? 'Средний' : 'Низкий'}
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-700">{description}</p>
        </div>
      </div>
    </div>
  );
}
