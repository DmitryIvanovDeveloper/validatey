import { ref } from 'vue';
import { Project } from '../../domain/entities/project.entity';

export class ProjectListViewModel {
  projects = ref<Project[]>([]);
  loading = ref(false);
  error = ref<string | null>(null);
}


