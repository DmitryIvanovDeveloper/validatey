import { ref } from 'vue';
import { ProjectReport } from '../../domain/entities/project-report.entity';

export class ReportViewModel {
  report = ref<ProjectReport | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
}

