import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ServeLandingFileUseCase } from '../../application/use-cases/serve-landing-file.use-case';

@injectable()
export class PublicLandingController {
  constructor(
    @inject(TYPES.ServeLandingFileUseCase)
    private readonly _serveFileUseCase: ServeLandingFileUseCase
  ) {}

  async serveLandingFile(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug;
      let filepath = req.params.filepath || 'index.html';

      // If no filepath, serve index.html
      if (!req.params.filepath) {
        filepath = 'index.html';
      }

      // Normalize path to prevent directory traversal
      filepath = filepath.replace(/\.\./g, '').replace(/^\/+/, '');

      const result = await this._serveFileUseCase.execute({
        slug,
        filepath,
      });

      if (!result.isSuccess) {
        const statusCode = result.error.name === 'LandingNotFoundError' ||
                          result.error.name === 'LandingFileNotFoundError' ? 404 : 500;

        if (statusCode === 404) {
          res.status(404).send('File not found');
        } else {
          res.status(500).send('Internal server error');
        }
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', result.data.contentType);
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

      // Handle CORS for landing subdomains
      const origin = req.headers.origin as string;
      if (origin && origin.endsWith('.validatey.com')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      res.send(result.data.buffer);
    } catch (error) {
      console.error('PublicLandingController.serveLandingFile error:', error);
      res.status(500).send('Internal server error');
    }
  }
}