import { useState } from 'react';
import { Search, Globe, Briefcase, Star, Download } from 'lucide-react';

export function ProjectScraper() {
  const [activeTab, setActiveTab] = useState<'websites' | 'reviews' | 'jobs'>('websites');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Scraper</h1>
            <p className="text-gray-600">
              Собирайте данные из внешних источников для анализа
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('websites')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'websites'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Сайты конкурентов
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Отзывы
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'jobs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Вакансии
          </button>
        </div>
      </div>

      {activeTab === 'websites' && <WebsitesTab />}
      {activeTab === 'reviews' && <ReviewsTab />}
      {activeTab === 'jobs' && <JobsTab />}
    </div>
  );
}

function WebsitesTab() {
  const [url, setUrl] = useState('');

  const scrapedSites = [
    {
      url: 'hubspot.com',
      title: 'HubSpot CRM',
      scraped: '2025-02-10',
      features: ['Free CRM', 'Marketing Hub', 'Sales Hub', 'Customer Service'],
      pricing: 'Free - $1,780/month',
    },
    {
      url: 'pipedrive.com',
      title: 'Pipedrive',
      scraped: '2025-02-10',
      features: ['Visual Pipeline', 'AI Sales Assistant', 'Email Integration', 'Mobile App'],
      pricing: '$14 - $99/user/month',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Введите URL сайта конкурента..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Scrape
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Мы извлечем информацию о функциях, ценах, и позиционировании
        </p>
      </div>

      {/* Scraped Sites */}
      <div className="space-y-4">
        {scrapedSites.map((site, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{site.title}</h3>
                  <a href={`https://${site.url}`} className="text-sm text-blue-600 hover:underline">
                    {site.url}
                  </a>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                Scraped {new Date(site.scraped).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Features</div>
                <div className="flex flex-wrap gap-2">
                  {site.features.map((feature, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">Pricing</div>
                <div className="text-gray-900">{site.pricing}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const reviews = [
    {
      platform: 'G2',
      product: 'HubSpot CRM',
      rating: 4.4,
      count: 10567,
      sentiment: 'positive',
      topPros: ['Easy to use', 'Great integrations', 'Free tier available'],
      topCons: ['Expensive at scale', 'Learning curve', 'Limited customization'],
    },
    {
      platform: 'Capterra',
      product: 'Pipedrive',
      rating: 4.5,
      count: 2890,
      sentiment: 'positive',
      topPros: ['Visual pipeline', 'Mobile app', 'Good support'],
      topCons: ['Limited reporting', 'No marketing features', 'UI feels dated'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Введите название продукта для поиска отзывов..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Найти отзывы
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">{review.rating}</span>
                  <span className="text-gray-600">({review.count.toLocaleString()} отзывов)</span>
                </div>
                <h3 className="font-bold text-gray-900">{review.product}</h3>
                <p className="text-sm text-gray-600">Источник: {review.platform}</p>
              </div>
              <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-green-700 mb-2">Top Pros</div>
                <ul className="space-y-1">
                  {review.topPros.map((pro, i) => (
                    <li key={i} className="text-sm text-gray-700">✓ {pro}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm font-medium text-red-700 mb-2">Top Cons</div>
                <ul className="space-y-1">
                  {review.topCons.map((con, i) => (
                    <li key={i} className="text-sm text-gray-700">✗ {con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobsTab() {
  const jobs = [
    {
      company: 'HubSpot',
      title: 'Senior Product Manager - CRM',
      location: 'Remote',
      posted: '2025-02-05',
      skills: ['Product Strategy', 'CRM', 'AI/ML', 'B2B SaaS'],
      insights: 'Фокус на AI-powered features и SMB сегмент',
    },
    {
      company: 'Salesforce',
      title: 'Lead CRM Engineer',
      location: 'San Francisco, CA',
      posted: '2025-02-08',
      skills: ['React', 'Node.js', 'Microservices', 'CRM APIs'],
      insights: 'Развивают Einstein AI для автоматизации',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Поиск вакансий по компаниям или технологиям..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Найти
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Анализ вакансий помогает понять, на чем конкуренты делают ставку
        </p>
      </div>

      <div className="space-y-4">
        {jobs.map((job, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span>{job.company}</span>
                  <span>•</span>
                  <span>{job.location}</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(job.posted).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Required Skills</div>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">💡 Insight</div>
              <p className="text-sm text-blue-800">{job.insights}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
