import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Sparkles, FileText, Users, Check } from 'lucide-react';

type WizardStep = 'who-what' | 'how-ask' | 'who-to-ask';

export function CreateProject() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('who-what');
  const [formData, setFormData] = useState({
    // Step 1: Who & What
    segment: '',
    hypothesis: '',
    assumptions: ['', '', ''],
    marketContext: '',
    
    // Step 2: How will we ask
    scenarioType: 'ai', // 'template', 'ai', 'manual'
    template: '',
    aiPrompt: '',
    
    // Step 3: Who to ask
    projectName: '',
    audienceSize: 100,
    distributionMethod: 'email',
  });

  const steps = [
    { id: 'who-what', label: 'Who & What?', icon: Users },
    { id: 'how-ask', label: 'How will we ask?', icon: FileText },
    { id: 'who-to-ask', label: 'Who to ask?', icon: Sparkles },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    if (currentStep === 'who-what') setCurrentStep('how-ask');
    else if (currentStep === 'how-ask') setCurrentStep('who-to-ask');
    else {
      // Create project and navigate to invitations
      const newProjectId = String(Date.now());
      navigate(`/projects/${newProjectId}/invitations`);
    }
  };

  const handleBack = () => {
    if (currentStep === 'how-ask') setCurrentStep('who-what');
    else if (currentStep === 'who-to-ask') setCurrentStep('how-ask');
    else navigate('/projects');
  };

  const updateAssumption = (index: number, value: string) => {
    const newAssumptions = [...formData.assumptions];
    newAssumptions[index] = value;
    setFormData({ ...formData, assumptions: newAssumptions });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад к проектам</span>
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Создать новый проект</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-600' :
                      isActive ? 'bg-blue-600' :
                      'bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' :
                        isCompleted ? 'text-green-600' :
                        'text-gray-400'
                      }`}>
                        Шаг {index + 1}
                      </div>
                      <div className={`text-sm ${
                        isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          {currentStep === 'who-what' && (
            <WhoWhatStep formData={formData} setFormData={setFormData} updateAssumption={updateAssumption} />
          )}
          {currentStep === 'how-ask' && (
            <HowAskStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 'who-to-ask' && (
            <WhoToAskStep formData={formData} setFormData={setFormData} />
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentStep === 'who-to-ask' ? 'Создать проект' : 'Далее'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function WhoWhatStep({ formData, setFormData, updateAssumption }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Сегмент и гипотеза</h2>
        <p className="text-gray-600">Определите целевую аудиторию и основную гипотезу</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Целевой сегмент
        </label>
        <input
          type="text"
          value={formData.segment}
          onChange={e => setFormData({ ...formData, segment: e.target.value })}
          placeholder="Например: Владельцы малого бизнеса 30-50 лет"
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
          placeholder="Что вы хотите проверить?"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Ключевые предположения (assumptions)
        </label>
        {formData.assumptions.map((assumption: string, index: number) => (
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
          placeholder="Опишите ситуацию на рынке, конкурентов, тренды..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function HowAskStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Сценарий опроса</h2>
        <p className="text-gray-600">Выберите способ создания сценария</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFormData({ ...formData, scenarioType: 'template' })}
          className={`p-6 border-2 rounded-xl text-left transition-all ${
            formData.scenarioType === 'template'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText className={`w-8 h-8 mb-3 ${
            formData.scenarioType === 'template' ? 'text-blue-600' : 'text-gray-400'
          }`} />
          <h3 className="font-bold text-gray-900 mb-1">Шаблон</h3>
          <p className="text-sm text-gray-600">Готовый проверенный сценарий</p>
        </button>

        <button
          onClick={() => setFormData({ ...formData, scenarioType: 'ai' })}
          className={`p-6 border-2 rounded-xl text-left transition-all ${
            formData.scenarioType === 'ai'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Sparkles className={`w-8 h-8 mb-3 ${
            formData.scenarioType === 'ai' ? 'text-blue-600' : 'text-gray-400'
          }`} />
          <h3 className="font-bold text-gray-900 mb-1">AI генерация</h3>
          <p className="text-sm text-gray-600">Создайте с помощью ИИ</p>
        </button>

        <button
          onClick={() => setFormData({ ...formData, scenarioType: 'manual' })}
          className={`p-6 border-2 rounded-xl text-left transition-all ${
            formData.scenarioType === 'manual'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText className={`w-8 h-8 mb-3 ${
            formData.scenarioType === 'manual' ? 'text-blue-600' : 'text-gray-400'
          }`} />
          <h3 className="font-bold text-gray-900 mb-1">Вручную</h3>
          <p className="text-sm text-gray-600">Создайте сами с нуля</p>
        </button>
      </div>

      {formData.scenarioType === 'ai' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Опишите, что хотите узнать
          </label>
          <textarea
            value={formData.aiPrompt}
            onChange={e => setFormData({ ...formData, aiPrompt: e.target.value })}
            placeholder="Например: Хочу понять, готовы ли клиенты платить за персонализированные рекомендации и какие функции им наиболее важны"
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <p className="mt-2 text-sm text-gray-500">
            AI создаст оптимальный сценарий опроса на основе вашего описания
          </p>
        </div>
      )}

      {formData.scenarioType === 'template' && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Выберите шаблон
          </label>
          <select
            value={formData.template}
            onChange={e => setFormData({ ...formData, template: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          >
            <option value="">Выберите шаблон...</option>
            <option value="product-market-fit">Product-Market Fit</option>
            <option value="pricing">Тестирование цены</option>
            <option value="feature-prioritization">Приоритизация функций</option>
            <option value="customer-satisfaction">Удовлетворенность клиентов</option>
          </select>
        </div>
      )}
    </div>
  );
}

function WhoToAskStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Настройка аудитории</h2>
        <p className="text-gray-600">Определите параметры исследования</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Название проекта
        </label>
        <input
          type="text"
          value={formData.projectName}
          onChange={e => setFormData({ ...formData, projectName: e.target.value })}
          placeholder="Например: Валидация CRM для малого бизнеса"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Целевое количество ответов
        </label>
        <input
          type="number"
          value={formData.audienceSize}
          onChange={e => setFormData({ ...formData, audienceSize: parseInt(e.target.value) })}
          min="10"
          max="10000"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <p className="mt-2 text-sm text-gray-500">
          Рекомендуем 50-200 ответов для валидации гипотезы
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Способ распространения
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setFormData({ ...formData, distributionMethod: 'email' })}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formData.distributionMethod === 'email'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900 mb-1">Email</div>
            <div className="text-sm text-gray-600">Персональные приглашения</div>
          </button>

          <button
            onClick={() => setFormData({ ...formData, distributionMethod: 'sms' })}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formData.distributionMethod === 'sms'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900 mb-1">SMS</div>
            <div className="text-sm text-gray-600">Быстрая рассылка</div>
          </button>

          <button
            onClick={() => setFormData({ ...formData, distributionMethod: 'link' })}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              formData.distributionMethod === 'link'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900 mb-1">Публичная ссылка</div>
            <div className="text-sm text-gray-600">Для соцсетей и рекламы</div>
          </button>
        </div>
      </div>
    </div>
  );
}
