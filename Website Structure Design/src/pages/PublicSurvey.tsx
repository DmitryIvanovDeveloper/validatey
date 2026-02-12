import { useState } from 'react';
import { useParams } from 'react-router';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const mockSurveyQuestions = [
  {
    id: 'q1',
    type: 'radio',
    question: 'Насколько вы заинтересованы в AI-powered CRM для малого бизнеса?',
    options: [
      'Очень заинтересован - готов попробовать прямо сейчас',
      'Заинтересован - хотел бы узнать больше',
      'Возможно, если цена будет подходящей',
      'Не заинтересован',
    ],
  },
  {
    id: 'q2',
    type: 'radio',
    question: 'Сколько вы готовы платить за такое решение ежемесячно?',
    options: [
      'До $30/месяц',
      '$30-49/месяц',
      '$50-79/месяц',
      '$80-120/месяц',
      'Более $120/месяц',
    ],
  },
  {
    id: 'q3',
    type: 'checkbox',
    question: 'Какие функции для вас наиболее важны? (выберите до 3)',
    options: [
      'AI автоматизация рутинных задач',
      'Email интеграция',
      'Аналитика и отчеты',
      'Мобильное приложение',
      'Интеграция с другими инструментами',
      'Управление задачами',
    ],
  },
  {
    id: 'q4',
    type: 'text',
    question: 'Какие проблемы вы испытываете с текущими CRM-решениями?',
    placeholder: 'Опишите основные сложности...',
  },
  {
    id: 'q5',
    type: 'scale',
    question: 'Насколько вероятно, что вы порекомендуете этот продукт коллегам? (NPS)',
    min: 0,
    max: 10,
  },
];

export function PublicSurvey() {
  const { token, slug } = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQuestion = mockSurveyQuestions[currentStep];
  const progress = ((currentStep + 1) / mockSurveyQuestions.length) * 100;

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentStep < mockSurveyQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit survey
      setIsSubmitted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = answers[currentQuestion?.id] !== undefined && answers[currentQuestion?.id] !== '';

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Спасибо за участие!</h1>
          <p className="text-gray-600 mb-8">
            Ваши ответы очень важны для нас. Мы используем их для создания лучшего продукта.
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-700 mb-4">
              Хотите узнать о запуске первыми? Оставьте свой email:
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Подписаться
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">V</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Опрос валидации</h1>
          <p className="text-gray-600">Помогите нам создать идеальный продукт для вас</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Вопрос {currentStep + 1} из {mockSurveyQuestions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {currentQuestion?.question}
          </h2>

          {currentQuestion?.type === 'radio' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion.id] === option
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => handleAnswer(currentQuestion.id, option)}
                    className="mt-1"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion?.type === 'checkbox' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    answers[currentQuestion.id]?.includes(option)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={answers[currentQuestion.id]?.includes(option) || false}
                    onChange={(e) => {
                      const current = answers[currentQuestion.id] || [];
                      const updated = e.target.checked
                        ? [...current, option].slice(0, 3)
                        : current.filter((o: string) => o !== option);
                      handleAnswer(currentQuestion.id, updated);
                    }}
                    className="mt-1"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
              <p className="text-sm text-gray-500 mt-2">
                Выбрано: {(answers[currentQuestion.id]?.length || 0)}/3
              </p>
            </div>
          )}

          {currentQuestion?.type === 'text' && (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          )}

          {currentQuestion?.type === 'scale' && (
            <div>
              <div className="flex justify-between mb-2">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQuestion.id, i)}
                    className={`w-12 h-12 rounded-lg font-bold transition-all ${
                      answers[currentQuestion.id] === i
                        ? 'bg-blue-600 text-white scale-110'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-3">
                <span>Совсем не вероятно</span>
                <span>Очень вероятно</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {currentStep === mockSurveyQuestions.length - 1 ? 'Завершить' : 'Далее'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Powered by <span className="font-semibold text-blue-600">Validatey</span>
        </div>
      </div>
    </div>
  );
}
