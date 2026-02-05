import { ref } from 'vue';
import { Survey } from '../../domain/entities/survey.entity';

export class SurveyViewModel {
  survey = ref<Survey | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
  currentQuestionIndex = ref(0);
  /** Consent: from API */
  consentRequired = ref(false);
  consentText = ref('');
  dataUsageText = ref('');
  privacyPolicyUrl = ref<string | null>(null);
  termsOfServiceUrl = ref<string | null>(null);
  alreadyConsented = ref(false);
  /** Set true after user clicks Continue on consent screen (or if alreadyConsented). */
  consentGiven = ref(false);
}



