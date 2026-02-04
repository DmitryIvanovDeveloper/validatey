import ResultEx from '../../../../infrastructure/result/result';
import { DeletionRequest } from '../../domain/entities/deletion-request.entity';
import { DeletionRequestStatus } from '../../domain/entities/deletion-request.entity';
import {
  DeletionRequestNotFoundError,
  InvalidDeletionRequestDataError,
} from '../../domain/errors/deletion-request.error';

export interface DeletionRequestRepositoryPort {
  save(request: DeletionRequest): Promise<ResultEx<DeletionRequest, InvalidDeletionRequestDataError>>;
  findById(id: string): Promise<ResultEx<DeletionRequest, DeletionRequestNotFoundError>>;
  findByProjectId(projectId: string): Promise<ResultEx<DeletionRequest[], Error>>;
  updateStatus(id: string, status: DeletionRequestStatus): Promise<ResultEx<DeletionRequest, DeletionRequestNotFoundError | InvalidDeletionRequestDataError>>;
}
