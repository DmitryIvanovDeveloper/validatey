import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { UploadFileUseCaseRequest } from '../../application/use-cases/input-output/upload-file.io';

@injectable()
export class StorageController {
	constructor(
		@inject(TYPES.UploadFileUseCase)
		private readonly _uploadFileUseCase: UploadFileUseCase
	) {}

	public async uploadFile(request: UploadFileUseCaseRequest): Promise<ReturnType<UploadFileUseCase['execute']>> {
		return this._uploadFileUseCase.execute(request);
	}
}
