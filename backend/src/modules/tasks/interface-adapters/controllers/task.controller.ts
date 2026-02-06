import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CreateTaskUseCase } from '../../application/use-cases/create-task.use-case';
import { CreateTaskUseCaseRequest } from '../../application/use-cases/input-output/create-task.io';

@injectable()
export class TaskController {
	constructor(
		@inject(TYPES.CreateTaskUseCase)
		private readonly _createTaskUseCase: CreateTaskUseCase
	) {}

	public async createTask(request: CreateTaskUseCaseRequest): Promise<ReturnType<CreateTaskUseCase['execute']>> {
		return this._createTaskUseCase.execute(request);
	}
}
