import { ref } from 'vue';
import { Survey } from '../../domain/entities/survey.entity';

export class SurveyViewModel {
  survey = ref<Survey | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
  currentQuestionIndex = ref(0);
}



