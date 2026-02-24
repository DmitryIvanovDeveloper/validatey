import { ref } from 'vue';
import type { Project } from '../../domain/entities/project.entity';
import type { OverviewPayload } from '../../application/use-cases/input-output/get-project-overview.io';

export class ProjectViewModel {
  project = ref<Project | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
  /** Overview (command center + optional research summary). Set by presenter.loadOverview(). */
  overview = ref<OverviewPayload | null>(null);
}



