import { SurveyQuestion, QuestionOptions } from '../entities/survey.entity';

interface RawQuestion {
  id?: string;
  text: string;
  type: string;
  required?: boolean;
  options?: any;
}

interface ScenarioJson {
  questions?: RawQuestion[];
  [key: string]: any;
}

export class ScenarioParserService {
  /**
   * Parse scenario content (JSON or plain text) into an array of SurveyQuestion entities
   */
  static parse(content: string): SurveyQuestion[] {
    if (!content || !content.trim()) {
      return [];
    }

    const trimmed = content.trim();

    // Try to parse as JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as ScenarioJson;
        return this.parseJsonScenario(parsed);
      } catch (error) {
        // If JSON parsing fails, treat as plain text
        return this.parsePlainTextScenario(trimmed);
      }
    }

    // Plain text scenario
    return this.parsePlainTextScenario(trimmed);
  }

  /**
   * Parse JSON scenario structure
   */
  private static parseJsonScenario(scenario: ScenarioJson): SurveyQuestion[] {
    if (!scenario.questions || !Array.isArray(scenario.questions)) {
      return [];
    }

    return scenario.questions
      .map((q, index) => this.mapRawQuestionToSurveyQuestion(q, index))
      .filter((q): q is SurveyQuestion => q !== null);
  }

  /**
   * Parse plain text scenario (fallback)
   * Treats each line as a separate open-ended question
   */
  private static parsePlainTextScenario(content: string): SurveyQuestion[] {
    const lines = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'));

    if (lines.length === 0) {
      return [];
    }

    return lines.map((line, index) => ({
      id: `q_${index + 1}`,
      type: 'open' as const,
      text: line,
      required: false,
    }));
  }

  /**
   * Map raw question from JSON to SurveyQuestion entity
   */
  private static mapRawQuestionToSurveyQuestion(
    raw: RawQuestion,
    index: number
  ): SurveyQuestion | null {
    if (!raw.text || typeof raw.text !== 'string' || raw.text.trim().length === 0) {
      return null;
    }

    const id = raw.id || `q_${index + 1}`;
    const type = this.normalizeQuestionType(raw.type);
    const required = raw.required ?? false;
    const options = this.mapQuestionOptions(raw.type, raw.options);

    return {
      id,
      type,
      text: raw.text.trim(),
      required,
      options,
    };
  }

  /**
   * Normalize question type from raw input to domain type
   */
  private static normalizeQuestionType(rawType: string): 'scale' | 'open' | 'audio' | 'multiple_choice' {
    const normalized = rawType?.toLowerCase().trim();

    switch (normalized) {
      case 'scale':
      case 'rating':
      case 'numeric':
        return 'scale';
      case 'multiple_choice':
      case 'choice':
      case 'select':
      case 'radio':
      case 'checkbox':
        return 'multiple_choice';
      case 'audio':
      case 'voice':
      case 'recording':
        return 'audio';
      case 'open':
      case 'text':
      case 'textarea':
      case 'string':
      default:
        return 'open';
    }
  }

  /**
   * Map raw options to QuestionOptions
   */
  private static mapQuestionOptions(
    rawType: string,
    rawOptions: any
  ): QuestionOptions | undefined {
    if (!rawOptions) {
      return undefined;
    }

    const normalizedType = rawType?.toLowerCase().trim();

    // Scale question options
    if (normalizedType === 'scale' || normalizedType === 'rating' || normalizedType === 'numeric') {
      return {
        min: typeof rawOptions.min === 'number' ? rawOptions.min : 1,
        max: typeof rawOptions.max === 'number' ? rawOptions.max : 5,
        label: typeof rawOptions.label === 'string' ? rawOptions.label : undefined,
      };
    }

    // Multiple choice question options
    if (
      normalizedType === 'multiple_choice' ||
      normalizedType === 'choice' ||
      normalizedType === 'select' ||
      normalizedType === 'radio' ||
      normalizedType === 'checkbox'
    ) {
      const choices = Array.isArray(rawOptions)
        ? rawOptions
        : Array.isArray(rawOptions.choices)
        ? rawOptions.choices
        : [];

      return {
        choices: choices.filter((c: any): c is string => typeof c === 'string'),
        multiple: rawOptions.multiple === true || normalizedType === 'checkbox',
      };
    }

    return undefined;
  }
}
