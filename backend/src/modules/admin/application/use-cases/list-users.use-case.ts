import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { GetCallerRolePort } from '../ports/get-caller-role.port';
import type { ListUsersPort } from '../ports/list-users.port';
import { AdminAccessDeniedError } from '../../domain/errors/admin.error';
import type { Role } from '../../domain/value-objects/role.vo';
import { ListUsersUseCaseRequest, ListUsersUseCaseResponse } from './input-output/list-users.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ListUsersUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.GetCallerRole)
    private readonly _getCallerRole: GetCallerRolePort,
    @inject(TYPES.ListUsers)
    private readonly _listUsers: ListUsersPort
  ) {}

  async execute(
    request: ListUsersUseCaseRequest
  ): Promise<ResultEx<ListUsersUseCaseResponse, AdminAccessDeniedError | Error>> {
    this._logger.info('list-users.start', { callerUserId: request.callerUserId });

    const role: Role = await this._getCallerRole.getRole(request.callerUserId);
    if (role !== 'admin') {
      this._logger.warn('list-users.access-denied', { callerUserId: request.callerUserId });
      return ResultEx.failure(new AdminAccessDeniedError(request.callerUserId));
    }

    const users = await this._listUsers.list();
    this._logger.info('list-users.success', { count: users.length });

    return ResultEx.success({
      users,
    });
  }
}
