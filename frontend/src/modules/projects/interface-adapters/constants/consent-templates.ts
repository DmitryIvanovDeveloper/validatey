/**
 * Preset consent text templates for survey (interface-adapters: form prefill only).
 * User can select a template and edit placeholders (e.g. company name, email).
 */

export type ConsentTemplateId = 'eu_gdpr' | 'us_ccpa' | 'international';

export interface ConsentTemplate {
  id: ConsentTemplateId;
  label: string;
  consentText: string;
  dataUsageText?: string;
}

export const CONSENT_TEMPLATES: Record<ConsentTemplateId, ConsentTemplate> = {
  eu_gdpr: {
    id: 'eu_gdpr',
    label: 'EU / GDPR',
    consentText: `Я даю согласие на обработку моих персональных данных (электронная почта) компанией [Название компании] для целей участия в исследовании. Я понимаю, что могу отозвать согласие в любое время, написав на [email@company.com]`,
    dataUsageText: '',
  },
  us_ccpa: {
    id: 'us_ccpa',
    label: 'USA / CCPA',
    consentText: `Нажимая кнопку, я подтверждаю, что ознакомлен с политикой конфиденциальности и соглашаюсь на обработку моих данных для исследовательских целей`,
    dataUsageText: '',
  },
  international: {
    id: 'international',
    label: 'International',
    consentText: `I agree to participate in this research and consent to the processing of my data for research purposes`,
    dataUsageText: '',
  },
};

export const CONSENT_TEMPLATE_OPTIONS: { value: '' | ConsentTemplateId; label: string }[] = [
  { value: '', label: '— No template —' },
  { value: 'eu_gdpr', label: 'EU (GDPR)' },
  { value: 'us_ccpa', label: 'USA (CCPA)' },
  { value: 'international', label: 'International' },
];
