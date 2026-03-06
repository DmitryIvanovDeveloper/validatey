import { injectable, inject } from 'inversify';
import { ref, computed } from 'vue';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { UploadLandingUseCase } from '../../application/use-cases/upload-landing.use-case';
import { GetProjectLandingUseCase } from '../../application/use-cases/get-project-landing.use-case';
import { DeleteLandingUseCase } from '../../application/use-cases/delete-landing.use-case';
import { GenerateLandingUseCase } from '../../application/use-cases/generate-landing.use-case';
import { ProjectLandingEntity } from '../../domain/entities/project-landing.entity';

@injectable()
export class ProjectLandingPresenter {
  // Reactive state
  private _landing = ref<ProjectLandingEntity | null>(null);
  private _loading = ref(false);
  private _uploading = ref(false);
  private _error = ref<string | null>(null);

  constructor(
    @inject(TYPES.UploadLandingUseCase)
    private readonly _uploadUseCase: UploadLandingUseCase,
    @inject(TYPES.GetProjectLandingUseCase)
    private readonly _getUseCase: GetProjectLandingUseCase,
    @inject(TYPES.DeleteLandingUseCase)
    private readonly _deleteUseCase: DeleteLandingUseCase,
    @inject(TYPES.GenerateLandingUseCase)
    private readonly _generateUseCase: GenerateLandingUseCase
  ) {}

  // Reactive getters
  get landing() {
    return computed(() => this._landing.value);
  }

  get loading() {
    return computed(() => this._loading.value);
  }

  get uploading() {
    return computed(() => this._uploading.value);
  }

  get error() {
    return computed(() => this._error.value);
  }

  get hasLanding() {
    return computed(() => this._landing.value !== null);
  }

  // Actions
  async loadLanding(projectId: string): Promise<void> {
    this._loading.value = true;
    this._error.value = null;

    try {
      const result = await this._getUseCase.execute({ projectId });

      if (!result.isSuccess) {
        this._error.value = 'Failed to load landing information';
        return;
      }

      if (result.data.landing) {
        this._landing.value = ProjectLandingEntity.fromApiResponse(result.data.landing);
      } else {
        this._landing.value = null;
      }
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      this._loading.value = false;
    }
  }

  async uploadLanding(projectId: string, file: File): Promise<boolean> {
    this._uploading.value = true;
    this._error.value = null;

    try {
      const result = await this._uploadUseCase.execute({
        projectId,
        file,
      });

      if (!result.isSuccess) {
        this._error.value = result.error.message;
        return false;
      }

      this._landing.value = ProjectLandingEntity.fromApiResponse(result.data.landing);
      return true;
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : 'Upload failed';
      return false;
    } finally {
      this._uploading.value = false;
    }
  }

  async generateLandingWithAI(projectId: string, customPrompt?: string): Promise<boolean> {
    this._uploading.value = true; // Используем uploading для состояния генерации
    this._error.value = null;

    try {
      const result = await this._generateUseCase.execute({
        projectId,
        customPrompt: customPrompt?.trim()
      });

      if (!result.isSuccess) {
        this._error.value = result.error.message;
        return false;
      }

      // Обновляем landing только если бэкенд вернул лендинг для запрошенного проекта
      if (result.data.projectId !== projectId) {
        this._error.value = `Landing was created for another project. Reload the page.`;
        return false;
      }
      this._landing.value = result.data;
      return true;
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : 'Generation failed';
      return false;
    } finally {
      this._uploading.value = false;
    }
  }

  async deleteLanding(projectId: string): Promise<boolean> {
    this._loading.value = true;
    this._error.value = null;

    try {
      const result = await this._deleteUseCase.execute({ projectId });

      if (!result.isSuccess) {
        this._error.value = result.error.message;
        return false;
      }

      this._landing.value = null;
      return true;
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : 'Delete failed';
      return false;
    } finally {
      this._loading.value = false;
    }
  }

  clearError(): void {
    this._error.value = null;
  }

  // Labels for UI
  get labels() {
    return {
      title: 'Landing',
      description: 'Host your custom landing page on a subdomain',
      uploadButton: 'Upload Landing',
      deleteButton: 'Remove Landing',
      viewButton: 'View Landing',
      uploading: 'Uploading...',
      loading: 'Loading...',
      noLanding: 'No landing page uploaded yet',
      uploadHint: 'Upload a ZIP archive containing your landing page files',
      fileRequirements: 'Must include index.html. Supports HTML, CSS, JS, and images.',
      maxSize: 'Maximum size: 50MB',
      deleteConfirm: 'Are you sure you want to remove the landing page?',
      uploadSuccess: 'Landing page uploaded successfully!',
      deleteSuccess: 'Landing page removed successfully!',
    };
  }
}