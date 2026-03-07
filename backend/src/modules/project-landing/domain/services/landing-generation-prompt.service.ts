export interface LandingGenerationPromptData {
  hypothesis: string;
  problem: string;
  segment: string;
  /** Optional: short validation/synthesis summary for richer copy (e.g. "184 comments analyzed, 67% confirm problem") */
  validationData?: string;
  customPrompt?: string;
}

export class LandingGenerationPromptService {
  /**
   * Создает полный промпт для генерации landing страницы
   */
  static buildGenerationPrompt(data: LandingGenerationPromptData): string {
    return `${this.getSystemPrompt()}

${this.getContextPrompt(data)}

${this.getRequirementsPrompt(data)}

${this.getOutputFormatPrompt()}`;
  }

  /**
   * Системный промпт - позиционирует AI как профессионала
   */
  private static getSystemPrompt(): string {
    return `You are a premium SaaS landing page designer who creates stunning, conversion-focused pages that look like they cost $50K+ to design. You build pages that feel like Stripe, Linear, or Notion - elegant, trustworthy, and irresistible.

Your design philosophy: "Design that inspires confidence and desire. Every element should feel premium, thoughtful, and conversion-optimized. Think luxury hotel lobby meets Silicon Valley sleekness."

You create landing pages with:
- Dramatic visual impact that captures attention instantly
- Emotional storytelling that builds trust and desire
- Sophisticated color palettes and typography
- Interactive elements that feel luxurious and responsive
- The kind of polish that makes visitors think "this company knows what they're doing"

You never create anything generic, flat, or cheap-looking. Your designs are visually rich, emotionally engaging, and conversion-optimized.`;
  }

  /**
   * Извлекает заголовок из hypothesis текста
   */
  private static extractHeadlineFromHypothesis(hypothesis: string): string {
    if (!hypothesis) return "Discover Apps That Matter";

    // Ищем ключевые фразы в hypothesis
    if (hypothesis.toLowerCase().includes('personalized app discovery')) {
      return "Discover Apps That Matter To You";
    }
    if (hypothesis.toLowerCase().includes('app discovery')) {
      return "Find The Perfect Apps For Your Work";
    }
    if (hypothesis.toLowerCase().includes('tool')) {
      return "Find The Right Tools For Success";
    }

    // По умолчанию
    return "Discover Apps That Matter";
  }

  /**
   * Контекст проекта - данные из Supabase
   */
  private static getContextPrompt(data: LandingGenerationPromptData): string {
    return `PROJECT CONTEXT:
- Hypothesis: ${data.hypothesis}
- Problem Solved: ${data.problem}
- Target Audience: ${data.segment}
${data.validationData ? `- Validation Data (if available): ${data.validationData}` : ''}
${data.customPrompt ? `- Additional Instructions: ${data.customPrompt}` : ''}`;
  }

  /**
   * Технические требования к landing странице
   */
  private static getRequirementsPrompt(data: LandingGenerationPromptData): string {
    return `
Create a simple landing page for app discovery:

Hero section with headline and button.
Problem section with 3 bullet points.
Solution section with description.
Form with name, email, project fields.
2 testimonials.

Use modern design with gradients. Return valid HTML with inline CSS.`;
  }

  /**
   * Формат вывода - JSON с HTML/CSS/JS
   */
  private static getOutputFormatPrompt(): string {
    return `
OUTPUT FORMAT: Return ONLY valid JSON. Do not include markdown code blocks or explanations. Start your response with { and end with }.

{
  "html": "Complete HTML with inline CSS",
  "css": "Optional additional CSS",
  "js": "Optional JavaScript"
}`;
  }

  /**
   * Пример использования промпта
   */
  static getExamplePrompt(): string {
    return this.buildGenerationPrompt({
      hypothesis: "We believe that indie developers can validate their app ideas 10x faster using AI-powered user interviews, leading to 80% fewer failed launches",
      problem: "Indie developers waste months building apps that nobody wants, losing time and money on failed projects",
      segment: "Solo developers, indie founders, and small dev teams (1-5 people) building mobile/web apps",
      customPrompt: "Make it colorful and modern, add some subtle animations, focus on the speed benefit"
    });
  }
}