import ResultEx from '../../../../infrastructure/result/result';
import { Response } from '../../domain/entities/response.entity';
import { ResponseNotFoundError, InvalidResponseDataError } from '../../domain/errors/response.error';

export interface ResponseRepositoryPort {
  create(response: Response): Promise<ResultEx<Response, InvalidResponseDataError>>;
  findById(id: string): Promise<ResultEx<Response, ResponseNotFoundError>>;
  findByInvitationId(invitationId: string): Promise<ResultEx<Response | null, Error>>;
  findByProjectId(projectId: string): Promise<ResultEx<Response[], Error>>;
  update(response: Response): Promise<ResultEx<Response, ResponseNotFoundError | InvalidResponseDataError>>;
}



