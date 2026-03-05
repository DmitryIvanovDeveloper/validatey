import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import multer from 'multer';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { UploadLandingUseCase } from '../../application/use-cases/upload-landing.use-case';
import { GetProjectLandingUseCase } from '../../application/use-cases/get-project-landing.use-case';
import { DeleteLandingUseCase } from '../../application/use-cases/delete-landing.use-case';

@injectable()
export class ProjectLandingController {
  constructor(
    @inject(TYPES.UploadLandingUseCase)
    private readonly _uploadUseCase: UploadLandingUseCase,
    @inject(TYPES.GetProjectLandingUseCase)
    private readonly _getUseCase: GetProjectLandingUseCase,
    @inject(TYPES.DeleteLandingUseCase)
    private readonly _deleteUseCase: DeleteLandingUseCase
  ) {}

  async uploadLanding(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;

      if (!projectId) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Archive file is required' });
        return;
      }

      // Check file type
      if (!req.file.mimetype.includes('zip') &&
          !req.file.originalname.toLowerCase().endsWith('.zip')) {
        res.status(400).json({ error: 'Only ZIP archives are supported' });
        return;
      }

      const result = await this._uploadUseCase.execute({
        projectId,
        archiveBuffer: req.file.buffer,
        archiveFilename: req.file.originalname,
      });

      if (!result.isSuccess) {
        res.status(400).json({ error: result.error.message });
        return;
      }

      res.status(201).json(result.data);
    } catch (error) {
      console.error('ProjectLandingController.uploadLanding error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getProjectLanding(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;

      if (!projectId) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const result = await this._getUseCase.execute({ projectId });

      if (!result.isSuccess) {
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      res.status(200).json(result.data);
    } catch (error) {
      console.error('ProjectLandingController.getProjectLanding error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async deleteLanding(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.params.projectId;

      if (!projectId) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const result = await this._deleteUseCase.execute({ projectId });

      if (!result.isSuccess) {
        const statusCode = result.error.name === 'LandingNotFoundError' ? 404 : 400;
        res.status(statusCode).json({ error: result.error.message });
        return;
      }

      res.status(200).json(result.data);
    } catch (error) {
      console.error('ProjectLandingController.deleteLanding error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}