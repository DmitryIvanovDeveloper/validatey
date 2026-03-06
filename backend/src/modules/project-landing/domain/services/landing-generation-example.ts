import { LandingGenerationPromptService } from './landing-generation-prompt.service';

/**
 * Примеры использования LLM промпта для генерации landing страниц
 */
export class LandingGenerationExamples {

  /**
   * Пример 1: Стандартная генерация для SaaS продукта
   */
  static getExample1(): string {
    return LandingGenerationPromptService.buildGenerationPrompt({
      hypothesis: "We believe that indie developers can validate their app ideas 10x faster using AI-powered user interviews, leading to 80% fewer failed launches",
      problem: "Indie developers waste months building apps that nobody wants, losing time and money on failed projects",
      segment: "Solo developers, indie founders, and small dev teams (1-5 people) building mobile/web apps",
      customPrompt: "Make it colorful and modern, add some subtle animations, focus on the speed benefit"
    });
  }

  /**
   * Пример 2: B2B SaaS с enterprise фокусом
   */
  static getExample2(): string {
    return LandingGenerationPromptService.buildGenerationPrompt({
      hypothesis: "We believe that marketing teams can increase lead conversion by 300% using AI-powered landing page optimization",
      problem: "Marketing teams struggle with low conversion rates from their landing pages, wasting ad spend",
      segment: "Marketing managers and growth hackers in B2B SaaS companies with 50-500 employees",
      customPrompt: "Professional blue color scheme, add trust indicators, focus on ROI metrics, include case study section"
    });
  }

  /**
   * Пример 3: Consumer продукт
   */
  static getExample3(): string {
    return LandingGenerationPromptService.buildGenerationPrompt({
      hypothesis: "We believe that busy professionals can save 5 hours per week using AI-powered task management",
      problem: "Busy professionals waste hours managing tasks manually, leading to burnout and missed deadlines",
      segment: "Product managers, designers, and freelancers aged 25-45 working remotely",
      customPrompt: "Warm color palette, add testimonials, focus on time-saving benefits, mobile-first design"
    });
  }

  /**
   * Пример 4: Marketplace платформа
   */
  static getExample4(): string {
    return LandingGenerationPromptService.buildGenerationPrompt({
      hypothesis: "We believe that freelancers can find 2x more clients using our AI-powered matching platform",
      problem: "Freelancers struggle to find quality clients and waste time on unqualified leads",
      segment: "Freelancers in design, development, and marketing with 2-10 years experience",
      customPrompt: "Community-focused design, add success stories, emphasize matching algorithm, gamification elements"
    });
  }

  /**
   * Демонстрация структуры финального промпта
   */
  static getPromptStructure(): string {
    return `
🎯 СТРУКТУРА ПРОМПТА ДЛЯ AI ГЕНЕРАЦИИ LANDING:

1. СИСТЕМНЫЙ ПРОМПТ (позиционирование AI как эксперта)
   - Опыт: 15+ лет в landing page дизайне
   - Достижения: 500%+ повышение конверсии
   - Философия: "Каждый пиксель служит цели конверсии"

2. КОНТЕКСТ ПРОЕКТА (данные из Supabase)
   - Hypothesis: из project.hypothesis.description
   - Problem: из project.hypothesis.description
   - Segment: из project.segment.description
   - Custom Prompt: опциональные инструкции пользователя

3. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
   - Структура: Hero + Problem + Solution + Social Proof + CTA
   - Дизайн: Mobile-first, responsive, modern UI
   - Копирайтинг: User-focused, benefit-driven, power words
   - Техника: HTML5, CSS Grid, smooth animations

4. ФОРМАТ ВЫВОДА (JSON с HTML/CSS/JS)
   - Полный HTML с инлайновыми стилями
   - Опциональный CSS и JS
   - Metadata: конверсия, мобильная оптимизация, доступность

✨ РЕЗУЛЬТАТ: Профессиональная landing страница, готовая к публикации!
`;
  }
}