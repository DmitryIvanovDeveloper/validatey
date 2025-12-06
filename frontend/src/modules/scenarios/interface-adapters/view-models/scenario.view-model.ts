import { ref } from 'vue';
import { Scenario } from '../../domain/entities/scenario.entity';

export class ScenarioViewModel {
  scenario = ref<Scenario | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
}

