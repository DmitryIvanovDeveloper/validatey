import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { UploadFileUseCaseRequest } from '../../application/use-cases/input-output/upload-file.io';

@injectable()
export class StoragePresenter {
  constructor(
    @inject(TYPES.UploadFileUseCase)
    private readonly _uploadFileUseCase: UploadFileUseCase
  ) {}

  async uploadFile(request: UploadFileUseCaseRequest) {
    return await this._uploadFileUseCase.execute(request);
  }
}


