import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { GetCallerRolePort } from '../../../admin/application/ports/get-caller-role.port';
import type { ListWishlistPort } from '../../../admin/application/ports/list-wishlist.port';
import { AdminAccessDeniedError } from '../../../admin/domain/errors/admin.error';
import type { Role } from '../../../admin/domain/value-objects/role.vo';
import { ListWishlistUseCaseRequest, ListWishlistUseCaseResponse } from './input-output/list-wishlist.io';
import { TYPES as ADMIN_TYPES } from '../../../admin/infrastructure/bootstrap/types';

@injectable()
export class ListWishlistUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ADMIN_TYPES.GetCallerRole)
    private readonly _getCallerRole: GetCallerRolePort,
    @inject(ADMIN_TYPES.ListWishlist)
    private readonly _listWishlist: ListWishlistPort
  ) {}

  async execute(
    request: ListWishlistUseCaseRequest
  ): Promise<ResultEx<ListWishlistUseCaseResponse, AdminAccessDeniedError | Error>> {
    this._logger.info('list-wishlist.start', { callerUserId: request.callerUserId });

    const role: Role = await this._getCallerRole.getRole(request.callerUserId);
    if (role !== 'admin') {
      this._logger.warn('list-wishlist.access-denied', { callerUserId: request.callerUserId });
      return ResultEx.failure(new AdminAccessDeniedError(request.callerUserId));
    }

    const wishlist = await this._listWishlist.list();
    this._logger.info('list-wishlist.success', { count: wishlist.length });

    return ResultEx.success({
      wishlist,
    });
  }
}