import { useState } from 'react';
import { Sparkles, Search, FileText, TrendingUp, Users } from 'lucide-react';

export function ProjectResearch() {
  const [activeTab, setActiveTab] = useState<'market' | 'competitors' | 'synthesis'>('market');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Research Canvas</h1>
            <p className="text-gray-600">
              AI-powered исследование рынка и конкурентного окружения
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('market')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'market'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Анализ рынка
          </button>
          <button
            onClick={() => setActiveTab('competitors')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'competitors'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Конкуренты
          </button>
          <button
            onClick={() => setActiveTab('synthesis')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'synthesis'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Синтез
          </button>
        </div>
      </div>

      {activeTab === 'market' && <MarketAnalysisTab />}
      {activeTab === 'competitors' && <CompetitorsTab />}
      {activeTab === 'synthesis' && <SynthesisTab />}
    </div>
  );
}

function MarketAnalysisTab() {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Задайте вопрос об индустрии, трендах, размере рынка..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Исследовать
          </button>
        </div>
      </div>

      {/* Market Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InsightCard
          icon={TrendingUp}
          title="Размер рынка"
          content="Глобальный рынок CRM оценивается в $63.9B в 2024 году с ожидаемым ростом до $145.7B к 2029 году (CAGR 18%)"
          source="Statista, Gartner"
        />
        <InsightCard
          icon={Users}
          title="Целевая аудитория"
          content="Малый бизнес (10-50 сотрудников) составляет 28% рынка CRM. 67% используют только базовые функции."
          source="HubSpot Research"
        />
        <InsightCard
          icon={TrendingUp}
          title="Ключевые тренды"
          content="AI-интеграция, мобильность, персонализация. 82% компаний планируют увеличить инвестиции в CRM в 2024-2025."
          source="Salesforce State of CRM"
        />
        <InsightCard
          icon={FileText}
          title="Барьеры входа"
          content="Высокая конкуренция, сложность внедрения, необходимость интеграций. Time-to-value критичен для малого бизнеса."
          source="Industry Analysis"
        />
      </div>
    </div>
  );
}

function CompetitorsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 mb-1">Конкурентный анализ</h2>
          <p className="text-gray-600 text-sm">Основные игроки в сегменте CRM для малого бизнеса</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          <CompetitorCard
            name="HubSpot CRM"
            positioning="Бесплатная базовая версия + платные модули"
            strengths={['Известный бренд', 'Богатый функционал', 'Интеграции']}
            weaknesses={['Сложность для начинающих', 'Дорого при масштабировании']}
            price="Free - $1,780/мес"
          />
          <CompetitorCard
            name="Pipedrive"
            positioning="Простой и визуальный CRM для продаж"
            strengths={['Интуитивный интерфейс', 'Фокус на сделках', 'Автоматизация']}
            weaknesses={['Ограниченный маркетинг', 'Слабая аналитика']}
            price="$14 - $99/пользователь/мес"
          />
          <CompetitorCard
            name="Zoho CRM"
            positioning="Доступный CRM с AI-ассистентом Zia"
            strengths={['Низкая цена', 'AI функции', 'Кастомизация']}
            weaknesses={['Устаревший UI', 'Сложная настройка']}
            price="$14 - $52/пользователь/мес"
          />
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
        <h3 className="font-bold text-gray-900 mb-3">🎯 Gap Analysis</h3>
        <ul className="space-y-2 text-gray-700">
          <li>• Все конкуренты сложны в настройке для малого бизнеса</li>
          <li>• AI используется поверхностно (только рекомендации)</li>
          <li>• Отсутствует проактивный AI-ассистент для рутинных задач</li>
          <li>• Ценообразование не адаптировано под малый бизнес</li>
        </ul>
      </div>
    </div>
  );
}

function SynthesisTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Синтез исследования</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">🚀 Возможности (Opportunities)</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-800">✓ Растущий рынок с высоким CAGR (18%)</p>
              <p className="text-gray-800">✓ Недообслуженный сегмент малого бизнеса</p>
              <p className="text-gray-800">✓ Запрос на простоту и AI-автоматизацию</p>
              <p className="text-gray-800">✓ Willingness to pay за реальную экономию времени</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2">⚠️ Риски (Threats)</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-800">✗ Высокая конкуренция с крупными игроками</p>
              <p className="text-gray-800">✗ Низкий brand awareness на старте</p>
              <p className="text-gray-800">✗ Необходимость значительных инвестиций в R&D</p>
              <p className="text-gray-800">✗ Сложность удержания клиентов (low switching cost)</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2">💡 Рекомендации</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-800"><strong>Фокус на нишу:</strong> Специализация на конкретных индустриях малого бизнеса (e-commerce, услуги)</p>
              <p className="text-gray-800"><strong>AI как USP:</strong> Реальная автоматизация рутины, а не просто "AI-powered" маркетинг</p>
              <p className="text-gray-800"><strong>Ценообразование:</strong> Фиксированная цена $49-79/мес (не per-user) для предсказуемости</p>
              <p className="text-gray-800"><strong>Time-to-value:</strong> Онбординг менее 1 часа, первые результаты в день 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, content, source }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="font-bold text-gray-900 flex-1">{title}</h3>
      </div>
      <p className="text-gray-700 mb-3">{content}</p>
      <div className="text-xs text-gray-500">Источник: {source}</div>
    </div>
  );
}

function CompetitorCard({ name, positioning, strengths, weaknesses, price }: any) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">{name}</h3>
          <p className="text-gray-600 text-sm">{positioning}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{price}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-green-700 mb-2">Преимущества</div>
          <ul className="space-y-1">
            {strengths.map((s: string, i: number) => (
              <li key={i} className="text-sm text-gray-700">✓ {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-medium text-red-700 mb-2">Слабости</div>
          <ul className="space-y-1">
            {weaknesses.map((w: string, i: number) => (
              <li key={i} className="text-sm text-gray-700">✗ {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
