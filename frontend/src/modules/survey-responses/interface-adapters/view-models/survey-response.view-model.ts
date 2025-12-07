import { ref } from 'vue';
import { SurveyResponse } from '../../domain/entities/survey-response.entity';

export class SurveyResponseViewModel {
  responses = ref<SurveyResponse[]>([]);
  loading = ref(false);
  error = ref<string | null>(null);
}


