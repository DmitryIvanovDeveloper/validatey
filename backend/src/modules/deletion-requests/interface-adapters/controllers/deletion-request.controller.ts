import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CreateDeletionRequestUseCase } from '../../application/use-cases/create-deletion-request.use-case';
import { ListDeletionRequestsByProjectUseCase } from '../../application/use-cases/list-deletion-requests-by-project.use-case';
import { ExecuteDeletionRequestUseCase } from '../../application/use-cases/execute-deletion-request.use-case';
import { CreateDeletionRequestUseCaseRequest } from '../../application/use-cases/input-output/create-deletion-request.io';
import { ListDeletionRequestsByProjectUseCaseRequest } from '../../application/use-cases/input-output/list-deletion-requests.io';
import { ExecuteDeletionRequestUseCaseRequest } from '../../application/use-cases/input-output/execute-deletion-request.io';

@injectable()
export class DeletionRequestController {
	constructor(
		@inject(TYPES.CreateDeletionRequestUseCase)
		private readonly _createDeletionRequestUseCase: CreateDeletionRequestUseCase,
		@inject(TYPES.ListDeletionRequestsByProjectUseCase)
		private readonly _listDeletionRequestsByProjectUseCase: ListDeletionRequestsByProjectUseCase,
		@inject(TYPES.ExecuteDeletionRequestUseCase)
		private readonly _executeDeletionRequestUseCase: ExecuteDeletionRequestUseCase
	) {}

	public async createDeletionRequest(request: CreateDeletionRequestUseCaseRequest): Promise<ReturnType<CreateDeletionRequestUseCase['execute']>> {
		return this._createDeletionRequestUseCase.execute(request);
	}

	public async listDeletionRequestsByProject(request: ListDeletionRequestsByProjectUseCaseRequest): Promise<ReturnType<ListDeletionRequestsByProjectUseCase['execute']>> {
		return this._listDeletionRequestsByProjectUseCase.execute(request);
	}

	public async executeDeletionRequest(request: ExecuteDeletionRequestUseCaseRequest): Promise<ReturnType<ExecuteDeletionRequestUseCase['execute']>> {
		return this._executeDeletionRequestUseCase.execute(request);
	}
}
