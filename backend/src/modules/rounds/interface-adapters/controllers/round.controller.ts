import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CreateRoundUseCase } from '../../application/use-cases/create-round.use-case';
import { ListRoundsByProjectUseCase } from '../../application/use-cases/list-rounds-by-project.use-case';
import { GetRoundUseCase } from '../../application/use-cases/get-round.use-case';
import { UpdateRoundUseCase } from '../../application/use-cases/update-round.use-case';
import { DeleteRoundUseCase } from '../../application/use-cases/delete-round.use-case';
import type {
  CreateRoundRequest,
  ListRoundsByProjectRequest,
  GetRoundRequest,
  UpdateRoundRequest,
  DeleteRoundRequest,
} from '../../application/use-cases/input-output/round.io';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class RoundController {
  constructor(
    @inject(TYPES.CreateRoundUseCase)
    private readonly _createRoundUseCase: CreateRoundUseCase,
    @inject(TYPES.ListRoundsByProjectUseCase)
    private readonly _listRoundsByProjectUseCase: ListRoundsByProjectUseCase,
    @inject(TYPES.GetRoundUseCase)
    private readonly _getRoundUseCase: GetRoundUseCase,
    @inject(TYPES.UpdateRoundUseCase)
    private readonly _updateRoundUseCase: UpdateRoundUseCase,
    @inject(TYPES.DeleteRoundUseCase)
    private readonly _deleteRoundUseCase: DeleteRoundUseCase
  ) {}

  async create(request: CreateRoundRequest): Promise<ResultEx<unknown, Error>> {
    return this._createRoundUseCase.execute(request);
  }

  async listByProject(request: ListRoundsByProjectRequest): Promise<ResultEx<unknown[], Error>> {
    return this._listRoundsByProjectUseCase.execute(request);
  }

  async get(request: GetRoundRequest): Promise<ResultEx<unknown, Error>> {
    return this._getRoundUseCase.execute(request);
  }

  async update(request: UpdateRoundRequest): Promise<ResultEx<unknown, Error>> {
    return this._updateRoundUseCase.execute(request);
  }

  async delete(request: DeleteRoundRequest): Promise<ResultEx<void, Error>> {
    return this._deleteRoundUseCase.execute(request);
  }
}
