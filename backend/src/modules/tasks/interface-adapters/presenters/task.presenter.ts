import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CreateTaskUseCase } from '../../application/use-cases/create-task.use-case';
import { CreateTaskUseCaseRequest } from '../../application/use-cases/input-output/create-task.io';

@injectable()
export class TaskPresenter {
  constructor(
    @inject(TYPES.CreateTaskUseCase)
    private readonly _createTaskUseCase: CreateTaskUseCase
  ) {}

  async createTask(request: CreateTaskUseCaseRequest) {
    return await this._createTaskUseCase.execute(request);
  }
}



