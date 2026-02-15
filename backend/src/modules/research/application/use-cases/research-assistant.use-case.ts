import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import { COMMENT_TYPES } from '../../../comments/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { ResearchAssistantLlmPort } from '../ports/research-assistant-llm.port';
import type { CommentRepositoryPort } from '../../../comments/application/ports/comment-repository.port';
import { ResearchNotFoundError } from '../../domain/errors/research.error';
import type {
  ResearchAssistantRequest,
  ResearchAssistantResponse,
} from './input-output/research-assistant.io';

@injectable()
export class ResearchAssistantUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(RESEARCH_TYPES.ResearchAssistantLlm)
    private readonly _assistantLlm: ResearchAssistantLlmPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(
    request: ResearchAssistantRequest
  ): Promise<ResultEx<ResearchAssistantResponse, ResearchNotFoundError | Error>> {
    const { projectId, message } = request;
    this._logger.info('research-assistant.reply', { projectId });

    try {
      const projectResult = await this._projectRepository.findById(projectId);
      if (!projectResult.isSuccess) {
        return ResultEx.failure(new ResearchNotFoundError(projectId));
      }
      const project = projectResult.data;

      // Get comments for additional context
      const commentsResult = await this._commentRepository.findByProjectId(projectId, { limit: 10 });
      const comments = commentsResult.isSuccess ? commentsResult.data : [];

      const context = {
        projectName: project.name,
        hypothesisSummary: project.hypothesis?.description ?? project.name ?? 'No hypothesis',
        comments: comments.map(comment => ({
          content: comment.content,
          author: comment.author || undefined,
          contextTitle: comment.contextTitle || undefined,
          sourceType: comment.sourceId ? 'external' : 'unknown',
        })),
      };

      this._logger.info('research-assistant.context', {
        projectId,
        projectName: context.projectName,
        hypothesisSummary: context.hypothesisSummary,
        commentCount: context.comments?.length || 0,
        hasComments: (context.comments?.length || 0) > 0
      });

      const result = await this._assistantLlm.reply(message.trim(), context);
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }
      return ResultEx.success(result.data);
    } catch (error) {
      this._logger.error('research-assistant.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
