import { ref, reactive } from 'vue';
import { Project } from '../../domain/entities/project.entity';

export class ProjectViewModel {
  project = ref<Project | null>(null);
  loading = ref(false);
  error = ref<string | null>(null);
}



