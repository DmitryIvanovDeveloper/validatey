import { injectable } from 'inversify';
import yauzl from 'yauzl';
import Result from '../../../../infrastructure/result/result';
import { ArchiveExtractorPort, ArchiveFileInfo } from '../../application/ports/archive-extractor.port';

@injectable()
export class ZipArchiveExtractorAdapter implements ArchiveExtractorPort {
  async extractArchive(
    archiveBuffer: Buffer,
    filename: string
  ): Promise<Result<ArchiveFileInfo[], Error>> {
    return new Promise((resolve) => {
      const files: ArchiveFileInfo[] = [];

      yauzl.fromBuffer(archiveBuffer, { lazyEntries: true }, (error, zipfile) => {
        if (error) {
          resolve(Result.failure(new Error(`Failed to open archive: ${error.message}`)));
          return;
        }

        if (!zipfile) {
          resolve(Result.failure(new Error('Failed to create zipfile instance')));
          return;
        }

        zipfile.readEntry();

        zipfile.on('entry', (entry) => {
          // Skip directories
          if (entry.fileName.endsWith('/')) {
            zipfile.readEntry();
            return;
          }

          // Skip macOS metadata files
          if (entry.fileName.startsWith('__MACOSX/') ||
              entry.fileName.includes('.DS_Store') ||
              entry.fileName.startsWith('._')) {
            zipfile.readEntry();
            return;
          }

          // Validate filename
          if (!this.isValidFilename(entry.fileName)) {
            zipfile.readEntry();
            return;
          }

          zipfile.openReadStream(entry, (error, readStream) => {
            if (error) {
              resolve(Result.failure(new Error(`Failed to read file ${entry.fileName}: ${error.message}`)));
              return;
            }

            if (!readStream) {
              resolve(Result.failure(new Error(`Failed to create read stream for ${entry.fileName}`)));
              return;
            }

            const chunks: Buffer[] = [];
            readStream.on('data', (chunk) => {
              chunks.push(chunk);
            });

            readStream.on('end', () => {
              const buffer = Buffer.concat(chunks);
              const contentType = this.guessContentType(entry.fileName);

              files.push({
                filename: entry.fileName,
                contentType,
                size: buffer.length,
                buffer,
              });

              zipfile.readEntry();
            });

            readStream.on('error', (error) => {
              resolve(Result.failure(new Error(`Failed to read file ${entry.fileName}: ${error.message}`)));
            });
          });
        });

        zipfile.on('end', () => {
          resolve(Result.success(files));
        });

        zipfile.on('error', (error) => {
          resolve(Result.failure(new Error(`Archive processing error: ${error.message}`)));
        });
      });
    });
  }

  validateArchiveStructure(files: ArchiveFileInfo[]): Result<void, Error> {
    // Check if there's an index.html file
    const hasIndexHtml = files.some(file =>
      file.filename.toLowerCase() === 'index.html' ||
      file.filename.toLowerCase().endsWith('/index.html')
    );

    if (!hasIndexHtml) {
      return Result.failure(new Error('Archive must contain an index.html file in the root directory'));
    }

    // Check for potentially dangerous files
    const dangerousFiles = files.filter(file =>
      file.filename.toLowerCase().includes('.exe') ||
      file.filename.toLowerCase().includes('.bat') ||
      file.filename.toLowerCase().includes('.cmd') ||
      file.filename.toLowerCase().includes('.scr') ||
      file.filename.toLowerCase().includes('.pif') ||
      file.filename.toLowerCase().includes('.com')
    );

    if (dangerousFiles.length > 0) {
      return Result.failure(new Error('Archive contains potentially dangerous executable files'));
    }

    // Check file sizes (individual files shouldn't be too large)
    const maxFileSize = 10 * 1024 * 1024; // 10MB per file
    const oversizedFiles = files.filter(file => file.size > maxFileSize);

    if (oversizedFiles.length > 0) {
      return Result.failure(new Error(`Some files are too large: ${oversizedFiles.map(f => f.filename).join(', ')}`));
    }

    return Result.success(undefined);
  }

  private isValidFilename(filename: string): boolean {
    // Basic validation - no absolute paths, no path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      return false;
    }

    // Check for valid characters
    const validRegex = /^[a-zA-Z0-9._\-\s\/]+$/;
    return validRegex.test(filename);
  }

  private guessContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();

    const mimeTypes: Record<string, string> = {
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'text/xml',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'ico': 'image/x-icon',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'eot': 'application/vnd.ms-fontobject',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}