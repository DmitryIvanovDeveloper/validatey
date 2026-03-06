import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { LandingNotFoundError, LandingFileNotFoundError } from '../../domain/errors/landing.error';
import { ProjectLandingRepositoryPort } from '../ports/project-landing-repository.port';
import { LandingFileStoragePort } from '../ports/landing-file-storage.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ServeLandingFileUseCaseRequest, ServeLandingFileUseCaseResponse } from './input-output/serve-landing-file.io';

@injectable()
export class ServeLandingFileUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectLandingRepository)
    private readonly _repository: ProjectLandingRepositoryPort,
    @inject(TYPES.LandingFileStorage)
    private readonly _fileStorage: LandingFileStoragePort
  ) {}

  async execute(
    request: ServeLandingFileUseCaseRequest
  ): Promise<ResultEx<ServeLandingFileUseCaseResponse, LandingNotFoundError | LandingFileNotFoundError>> {
    this._logger.info('serve-landing-file.start', {
      slug: request.slug,
      filepath: request.filepath
    });

    try {
      // Find landing by slug
      const landingResult = await this._repository.findBySlug(request.slug);
      if (!landingResult.isSuccess) {
        return ResultEx.failure(landingResult.error);
      }

      const landing = landingResult.data;
      if (!landing) {
        return ResultEx.failure(new LandingNotFoundError(`landing with slug ${request.slug}`));
      }

      // Get all files for this landing
      const filesResult = await this._repository.getLandingFiles(landing.id);
      if (!filesResult.isSuccess) {
        return ResultEx.failure(filesResult.error);
      }

      // Find the requested file
      const file = filesResult.data.find(f => f.filename === request.filepath);
      if (!file) {
        return ResultEx.failure(new LandingFileNotFoundError(request.filepath));
      }

      // Get file content from storage
      const fileResult = await this._fileStorage.getFile(file.storagePath);
      if (!fileResult.isSuccess) {
        this._logger.error('serve-landing-file.storage-error', {
          error: fileResult.error,
          path: file.storagePath
        });
        return ResultEx.failure(new LandingFileNotFoundError(request.filepath));
      }

      let buffer = fileResult.data;
      const contentType = file.contentType;
      const filename = file.filename;

      // Inject waitlist widget into index.html (external script to avoid CSP blocking inline scripts)
      const isIndexHtml = /^index\.html?$/i.test(request.filepath);
      if (isIndexHtml && landing && /text\/html/i.test(contentType)) {
        let html = buffer.toString('utf8');
        // Remove inline scripts to avoid CSP violation (script-src 'self'); keep external <script src="...">
        html = html.replace(/<script\b[\s\S]*?<\/script>/gi, (match) =>
          /\bsrc\s*=\s*["']/i.test(match) ? match : ''
        );
        const closeBody = '</body>';
        const idx = html.indexOf(closeBody);
        if (idx !== -1) {
          const pid = landing.projectId.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          const snippet = [
            '<section id="validatey-waitlist-section" class="validatey-waitlist-section" aria-label="Join waitlist" style="margin-top:2rem;padding:1.5rem;border-top:1px solid #e5e7eb;">',
            '<h2 style="font-size:1.25rem;margin-bottom:1rem;">Get notified when we launch</h2>',
            '<div id="validatey-waitlist"></div>',
            '<script src="/embed/waitlist.js" data-project-id="' + pid + '" data-target="validatey-waitlist"><\/script>',
            '</section>',
            closeBody
          ].join('\n');
          html = html.slice(0, idx) + '\n' + snippet + html.slice(idx + closeBody.length);
          buffer = Buffer.from(html, 'utf8');
        }
      }

      this._logger.info('serve-landing-file.success', {
        slug: request.slug,
        filepath: request.filepath,
        contentType,
        size: buffer.length
      });

      return ResultEx.success({
        buffer,
        contentType,
        filename,
      });
    } catch (error) {
      this._logger.error('serve-landing-file.error', {
        error,
        slug: request.slug,
        filepath: request.filepath
      });
      if (error instanceof LandingNotFoundError || error instanceof LandingFileNotFoundError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new LandingFileNotFoundError(request.filepath));
    }
  }
}