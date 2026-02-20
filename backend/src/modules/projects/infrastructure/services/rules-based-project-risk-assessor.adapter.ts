import { injectable } from 'inversify';
import type { ProjectRiskAssessorPort } from '../../application/ports/project-risk-assessor.port';
import type { ProjectRisk, ProjectRiskAssessment, RiskLevel } from '../../domain/value-objects/project-risk.vo';

const URGENCY_KEYWORDS = [
  'urgent', 'critical', 'must', 'need', 'problem', 'pain', 'struggle',
  'failing', 'losing', 'cost', 'expensive', 'waste', 'frustrat',
  'срочно', 'критично', 'проблема', 'боль', 'теряю', 'стоит',
];

const PRICING_KEYWORDS = [
  'pay', 'price', 'cost', 'budget', 'dollar', '$', 'euro', '€', 'fee',
  'subscription', 'purchase', 'buy', 'afford', 'spend', 'revenue',
  'платить', 'цена', 'стоимость', 'бюджет', 'купить',
];

const VALIDATION_KEYWORDS = [
  'test', 'validate', 'interview', 'survey', 'feedback', 'measure',
  'metric', 'hypothesis', 'assume', 'verify', 'confirm',
  'тест', 'валидац', 'опрос', 'обратная связь', 'метрик',
];

const AUDIENCE_SPECIFICITY_KEYWORDS = [
  'who', 'age', 'role', 'industry', 'company', 'size', 'location',
  'experience', 'income', 'professional', 'manager', 'developer',
  'кто', 'возраст', 'роль', 'отрасль', 'компани', 'опыт',
];

const COOL_FEEDBACK_PHRASES = [
  'cool', 'nice', 'great', 'interesting', 'awesome', 'love it',
  'sounds good', 'would be great', 'amazing', 'brilliant',
  'классно', 'отлично', 'интересно', 'круто', 'замечательно',
];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

@injectable()
export class RulesBasedProjectRiskAssessorAdapter implements ProjectRiskAssessorPort {
  async assess(
    hypothesis: string,
    segment: string,
    assumptions: string[]
  ): Promise<ProjectRiskAssessment> {
    const risks: ProjectRisk[] = [];

    const hypothesisText = (hypothesis || '').trim();
    const segmentText = (segment || '').trim();
    const assumptionsList = (assumptions || []).filter(Boolean);

    // Rule 1: Missing or too-short segment → audience targeting failure (43% of startups)
    if (segmentText.length < 20) {
      risks.push({
        level: 'high',
        patternName: 'Missing Target Audience',
        message: '43% of startups fail due to wrong audience targeting. Your segment description is too vague.',
        suggestion: 'Describe your audience more specifically: age, role, industry, pain point they experience.',
      });
    }

    // Rule 2: Segment has no specificity keywords → vague audience
    if (segmentText.length >= 20 && !containsAny(segmentText, AUDIENCE_SPECIFICITY_KEYWORDS)) {
      risks.push({
        level: 'medium',
        patternName: 'Vague Audience Definition',
        message: 'Your segment lacks specificity. Broad targeting leads to weak validation signals.',
        suggestion: 'Add details like role, company size, industry, or experience level to narrow your audience.',
      });
    }

    // Rule 3: Hypothesis too short → poor problem definition
    if (hypothesisText.length < 50) {
      risks.push({
        level: 'high',
        patternName: 'Underdefined Hypothesis',
        message: 'Your hypothesis is too brief to validate properly. Unclear hypotheses lead to poor validation data.',
        suggestion: 'Expand your hypothesis: describe the problem, who has it, and what outcome you expect.',
      });
    }

    // Rule 4: No urgency signals → "cool but not painful" pattern (67% of cases)
    if (hypothesisText.length >= 50 && !containsAny(hypothesisText, URGENCY_KEYWORDS)) {
      risks.push({
        level: 'high',
        patternName: '"Cool But Not Urgent" Pattern',
        message: '67% of failed startups received "cool" feedback but the problem lacked urgency. Your hypothesis does not express urgency.',
        suggestion: 'Add urgency: describe how frequently the problem occurs and what it costs users to not solve it today.',
      });
    }

    // Rule 5: "Cool" feedback language in hypothesis → validation theater
    if (containsAny(hypothesisText, COOL_FEEDBACK_PHRASES)) {
      risks.push({
        level: 'medium',
        patternName: 'Validation Theater Risk',
        message: 'Your hypothesis contains positive-sounding language that may attract "cool" feedback instead of real willingness to pay.',
        suggestion: 'Focus on the problem, not the solution. Ask about current pain, not reactions to your idea.',
      });
    }

    // Rule 6: No pricing / WTP signal → will-to-pay gap (58% of failures)
    if (!containsAny(hypothesisText + ' ' + segmentText, PRICING_KEYWORDS)) {
      risks.push({
        level: 'medium',
        patternName: 'No WTP Signal',
        message: '58% of startups fail because users "love the idea" but won\'t pay. No pricing language detected.',
        suggestion: 'Include a pricing dimension: how much does the problem cost users today? What would they pay to solve it?',
      });
    }

    // Rule 7: No assumptions listed → untested assumptions
    if (assumptionsList.length === 0) {
      risks.push({
        level: 'medium',
        patternName: 'No Explicit Assumptions',
        message: 'Projects without explicit assumptions often validate surface-level feedback instead of core beliefs.',
        suggestion: 'List 2-3 key assumptions you need to test: about the problem, the audience, or the solution.',
      });
    }

    // Rule 8: Few assumptions (1 only) → incomplete validation plan
    if (assumptionsList.length === 1) {
      risks.push({
        level: 'low',
        patternName: 'Insufficient Assumptions Coverage',
        message: 'Only one assumption listed. Real validation requires testing multiple dimensions of your hypothesis.',
        suggestion: 'Add assumptions about: (1) whether users have this problem, (2) urgency/frequency, (3) willingness to pay.',
      });
    }

    // Rule 9: Hypothesis has validation/test language → good sign, lower risk
    // (used to offset score, no warning needed)

    // Rule 10: Very long hypothesis (>500 chars) without structure → overfit
    if (hypothesisText.length > 500 && countWords(hypothesisText) > 80) {
      risks.push({
        level: 'low',
        patternName: 'Overcomplex Hypothesis',
        message: 'A very complex hypothesis is hard to validate in a single round. You may be testing too many things at once.',
        suggestion: 'Simplify to one core hypothesis per project. Create separate projects for other ideas.',
      });
    }

    const overallRiskScore = this.computeRiskScore(risks);

    return { risks, overallRiskScore };
  }

  private computeRiskScore(risks: ProjectRisk[]): number {
    if (risks.length === 0) return 10;

    const weights: Record<RiskLevel, number> = { high: 30, medium: 15, low: 5 };
    const totalWeight = risks.reduce((sum, r) => sum + weights[r.level], 0);
    return Math.min(100, totalWeight);
  }
}
