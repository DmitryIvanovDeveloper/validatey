import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { ProjectNotFoundError, ProjectAccessDeniedError } from '../../../projects/domain/errors/project.error';
import { LandingGenerationLLMPort } from '../ports/landing-generation-llm.port';
import { ZipArchiveCreatorPort } from '../ports/zip-archive-creator.port';
import { UploadLandingUseCase } from './upload-landing.use-case';
import { DeleteLandingUseCase } from './delete-landing.use-case';
import { LandingGenerationPromptService } from '../../domain/services/landing-generation-prompt.service';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { GenerateLandingUseCaseRequest, GenerateLandingUseCaseResponse } from './input-output/generate-landing.io';

@injectable()
export class GenerateLandingUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(TYPES.LandingGenerationLLM)
    private readonly _llmAdapter: LandingGenerationLLMPort,
    @inject(TYPES.ZipArchiveCreator)
    private readonly _zipCreator: ZipArchiveCreatorPort,
    @inject(TYPES.UploadLandingUseCase)
    private readonly _uploadUseCase: UploadLandingUseCase,
    @inject(TYPES.DeleteLandingUseCase)
    private readonly _deleteUseCase: DeleteLandingUseCase
  ) {}

  async execute(
    request: GenerateLandingUseCaseRequest
  ): Promise<ResultEx<GenerateLandingUseCaseResponse, Error>> {
    this._logger.info('generate-landing.start', {
      projectId: request.projectId,
      userId: request.userId,
      hasCustomPrompt: !!request.customPrompt
    });

    try {
      // 1. Получить проект из Supabase
      const projectResult = await this._projectRepository.findById(request.projectId);
      if (!projectResult.isSuccess) {
        this._logger.error('generate-landing.project-not-found', { projectId: request.projectId });
        return ResultEx.failure(new Error('Project not found'));
      }

      const project = projectResult.data;

      // 2. Проверить права доступа
      if (project.userId !== request.userId) {
        this._logger.warn('generate-landing.access-denied', {
          projectId: request.projectId,
          userId: request.userId,
          projectUserId: project.userId
        });
        return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
      }

      // 3. Сгенерировать промпт через специализированный сервис
      const promptData = {
        hypothesis: project.hypothesis?.description || '',
        problem: project.hypothesis?.description || '', // Можно расширить для разделения problem/solution
        segment: project.segment?.description || '',
        customPrompt: request.customPrompt
      };

      const prompt = LandingGenerationPromptService.buildGenerationPrompt(promptData);

      this._logger.info('generate-landing.llm-prompt-prepared', {
        projectId: request.projectId,
        promptLength: prompt.length,
        hasCustomPrompt: !!request.customPrompt
      });

      // 4. Вызвать LLM для генерации landing
      const llmResult = await this._llmAdapter.generateLanding({ prompt });
      if (!llmResult.isSuccess) {
        this._logger.error('generate-landing.llm-failed', {
          projectId: request.projectId,
          error: llmResult.error.message
        });
        return ResultEx.failure(llmResult.error);
      }

      // 5. Создать файлы из LLM ответа (подставляем имя продукта из гипотезы, если LLM оставил плейсхолдер)
      const productName = this.deriveProductName(project.hypothesis?.description);
      const files = this.createFilesFromLLMResponse(llmResult.data, productName);

      this._logger.info('generate-landing.files-created', {
        projectId: request.projectId,
        fileCount: files.length
      });

      // 6. Создать ZIP архив
      const zipBuffer = await this._zipCreator.createArchive(files);
      if (!zipBuffer.isSuccess) {
        this._logger.error('generate-landing.zip-creation-failed', {
          projectId: request.projectId,
          error: zipBuffer.error.message
        });
        return ResultEx.failure(zipBuffer.error);
      }

      // 7. Удалить существующий landing, если есть (перезапись)
      const deleteResult = await this._deleteUseCase.execute({ projectId: request.projectId });
      if (!deleteResult.isSuccess && deleteResult.error.name !== 'LandingNotFoundError') {
        this._logger.warn('generate-landing.delete-before-upload-failed', {
          projectId: request.projectId,
          error: deleteResult.error.message
        });
        return ResultEx.failure(deleteResult.error);
      }

      // 8. Сохранить через существующий upload use case
      const uploadResult = await this._uploadUseCase.execute({
        projectId: request.projectId,
        archiveBuffer: zipBuffer.data,
        archiveFilename: `ai-generated-landing-${Date.now()}.zip`
      });

      if (!uploadResult.isSuccess) {
        this._logger.error('generate-landing.upload-failed', {
          projectId: request.projectId,
          error: uploadResult.error.message
        });
        return ResultEx.failure(uploadResult.error);
      }

      this._logger.info('generate-landing.success', {
        projectId: request.projectId,
        landingId: uploadResult.data.landing.id,
        slug: uploadResult.data.landing.slug
      });

      return ResultEx.success({
        landing: uploadResult.data.landing
      });

    } catch (error) {
      this._logger.error('generate-landing.unexpected-error', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      return ResultEx.failure(new Error('Unexpected error during landing generation'));
    }
  }

  private deriveProductName(hypothesisDescription?: string): string {
    if (!hypothesisDescription || !hypothesisDescription.trim()) return 'Our Product';
    const words = hypothesisDescription.trim().split(/\s+/).slice(0, 4);
    return words.length ? words.join(' ') : 'Our Product';
  }

  private createFilesFromLLMResponse(llmResponse: any, productName: string): Array<{ filename: string; content: string; contentType: string }> {
    const files: Array<{ filename: string; content: string; contentType: string }> = [];
    const placeholders = [
      { from: '[Product Name]', to: productName },
      { from: '[product name]', to: productName }
    ];

    let html = llmResponse.html || '';
    placeholders.forEach(({ from, to }) => {
      html = html.split(from).join(to);
    });
    const hasCss = llmResponse.css && llmResponse.css.trim().length > 0;
    const hasJs = llmResponse.js && llmResponse.js.trim().length > 0;

    // Подключаем внешние styles.css и script.js в HTML, чтобы они гарантированно загружались.
    // Гарантируем базовые мета-теги для корректной разметки (viewport, charset), если LLM их не добавил.
    if (html) {
      const headMetas: string[] = [];
      if (!/<meta\s+charset/i.test(html)) headMetas.push('<meta charset="UTF-8">');
      if (!/<meta\s+name=["']viewport["']/i.test(html)) headMetas.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
      if (headMetas.length) {
        html = html.replace(/<head\s*>/i, '<head>\n' + headMetas.join('\n'));
      }
      if (hasCss && !/href\s*=\s*["']?styles\.css["']?/i.test(html)) {
        html = html.replace(/<\/head\s*>/i, '<link rel="stylesheet" href="styles.css">\n</head>');
      }
      if (hasJs && !/src\s*=\s*["']?script\.js["']?/i.test(html)) {
        html = html.replace(/<\/body\s*>/i, '<script src="script.js"></script>\n</body>');
      }
      files.push({
        filename: 'index.html',
        content: html,
        contentType: 'text/html'
      });
    }

    if (hasCss) {
      let css = llmResponse.css.trim();
      placeholders.forEach(({ from, to }) => { css = css.split(from).join(to); });
      files.push({
        filename: 'styles.css',
        content: css,
        contentType: 'text/css'
      });
    }

    if (hasJs) {
      let js = llmResponse.js.trim();
      placeholders.forEach(({ from, to }) => { js = js.split(from).join(to); });
      files.push({
        filename: 'script.js',
        content: js,
        contentType: 'application/javascript'
      });
    }

    return files;
  }
}