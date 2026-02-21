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
    consentText: `I consent to the processing of my personal data (email address) by [Company Name] for the purposes of participating in this research. I understand that I can withdraw my consent at any time by writing to [email@company.com]`,
    dataUsageText: '',
  },
  us_ccpa: {
    id: 'us_ccpa',
    label: 'USA / CCPA',
    consentText: `By clicking the button, I confirm that I have read the privacy policy and agree to the processing of my data for research purposes`,
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
