import { injectable } from 'inversify';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Result from '../../../../infrastructure/result/result';
import { LandingFileStoragePort } from '../../application/ports/landing-file-storage.port';

@injectable()
export class LocalLandingFileStorageAdapter implements LandingFileStoragePort {
  private readonly basePath = path.join(process.cwd(), 'uploads', 'landings');

  constructor() {
    // Ensure base directory exists
    this.ensureBaseDirectory();
  }

  private async ensureBaseDirectory(): Promise<void> {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  async saveFile(
    fileBuffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<Result<{ path: string; url: string }, Error>> {
    try {
      // Generate unique filename to avoid conflicts
      const ext = path.extname(filename);
      const basename = path.basename(filename, ext);
      const uniqueFilename = `${basename}-${uuidv4()}${ext}`;
      const filePath = path.join(this.basePath, uniqueFilename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write file
      await fs.writeFile(filePath, fileBuffer);

      // Generate URL (relative path for serving)
      const relativePath = path.relative(path.join(process.cwd(), 'uploads'), filePath);
      const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;

      return Result.success({
        path: relativePath,
        url,
      });
    } catch (error) {
      return Result.failure(new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  async getFile(filePath: string): Promise<Result<Buffer, Error>> {
    try {
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      const buffer = await fs.readFile(fullPath);
      return Result.success(buffer);
    } catch (error) {
      return Result.failure(new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  async deleteFile(filePath: string): Promise<Result<void, Error>> {
    try {
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      await fs.unlink(fullPath);
      return Result.success(undefined);
    } catch (error) {
      // Don't fail if file doesn't exist
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return Result.success(undefined);
      }
      return Result.failure(new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  async deleteFiles(filePaths: string[]): Promise<Result<void, Error>> {
    const errors: string[] = [];

    for (const filePath of filePaths) {
      const result = await this.deleteFile(filePath);
      if (!result.isSuccess) {
        errors.push(`Failed to delete ${filePath}: ${result.error.message}`);
      }
    }

    if (errors.length > 0) {
      return Result.failure(new Error(`Some files failed to delete: ${errors.join(', ')}`));
    }

    return Result.success(undefined);
  }
}