import { injectable } from 'inversify';
import {
  ValidateScenarioStructureUseCaseRequest,
  ValidateScenarioStructureUseCaseResponse,
} from './input-output/validate-scenario-structure.io';

type Question = { id?: string; type?: string; text?: string; required?: boolean; options?: unknown };

function parseQuestions(input: ValidateScenarioStructureUseCaseRequest['scenarioContent']): Question[] {
  if (typeof input === 'object' && input !== null && Array.isArray((input as { questions?: Question[] }).questions)) {
    return (input as { questions: Question[] }).questions;
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as { questions?: Question[] };
      return Array.isArray(parsed?.questions) ? parsed.questions : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Pure validation: no I/O. Returns warnings for template-specific structure (e.g. "Problem template needs at least one scale").
 */
@injectable()
export class ValidateScenarioStructureUseCase {
  execute(
    request: ValidateScenarioStructureUseCaseRequest
  ): ValidateScenarioStructureUseCaseResponse {
    const questions = parseQuestions(request.scenarioContent);
    const warnings: string[] = [];
    const slug = (request.templateSlug || '').toLowerCase();

    const hasScale = questions.some((q) => (q.type || '').toLowerCase() === 'scale');
    const hasOpen = questions.some((q) => (q.type || '').toLowerCase() === 'open');
    const hasMultipleChoice = questions.some((q) => (q.type || '').toLowerCase() === 'multiple_choice');

    if (slug === 'wtp') {
      if (!hasScale) {
        warnings.push('For Problem Validation (WTP), at least one scale question is recommended (e.g. problem severity 1–5).');
      }
      if (!hasOpen) {
        warnings.push('An open question for willingness to pay or alternatives helps WTP analysis.');
      }
    } else if (slug === 'feature-demand') {
      if (!hasScale) {
        warnings.push('For Feature Validation, at least one scale question (e.g. feature importance 1–5) is recommended.');
      }
      if (!hasMultipleChoice) {
        warnings.push('A multiple-choice question (e.g. "Would you pay extra?") helps feature demand metrics.');
      }
    } else if (slug === 'value-prop') {
      if (!hasScale) {
        warnings.push('For Value Proposition Test, at least one scale question (e.g. value match 1–5) is recommended.');
      }
    }

    if (questions.length === 0) {
      warnings.push('Scenario has no questions.');
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }
}
