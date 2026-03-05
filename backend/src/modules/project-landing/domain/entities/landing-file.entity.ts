import { randomUUID } from 'crypto';

export interface LandingFile {
  readonly id: string;
  readonly landingId: string;
  readonly filename: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly storagePath: string;
  readonly createdAt: Date;
}

export class LandingFileEntity implements LandingFile {
  private constructor(
    public readonly id: string,
    public readonly landingId: string,
    public readonly filename: string,
    public readonly contentType: string,
    public readonly sizeBytes: number,
    public readonly storagePath: string,
    public readonly createdAt: Date
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('File id cannot be empty');
    }
    if (!landingId || landingId.trim().length === 0) {
      throw new Error('Landing id cannot be empty');
    }
    if (!filename || filename.trim().length === 0) {
      throw new Error('Filename cannot be empty');
    }
    if (!contentType || contentType.trim().length === 0) {
      throw new Error('Content type cannot be empty');
    }
    if (sizeBytes < 0) {
      throw new Error('File size cannot be negative');
    }
    if (!storagePath || storagePath.trim().length === 0) {
      throw new Error('Storage path cannot be empty');
    }
  }

  static create(
    landingId: string,
    filename: string,
    contentType: string,
    sizeBytes: number,
    storagePath: string,
    id?: string,
    createdAt?: Date
  ): LandingFileEntity {
    return new LandingFileEntity(
      id || randomUUID(),
      landingId,
      filename,
      contentType,
      sizeBytes,
      storagePath,
      createdAt || new Date()
    );
  }

  static fromData(data: LandingFile): LandingFileEntity {
    return new LandingFileEntity(
      data.id,
      data.landingId,
      data.filename,
      data.contentType,
      data.sizeBytes,
      data.storagePath,
      data.createdAt
    );
  }

  toData(): LandingFile {
    return {
      id: this.id,
      landingId: this.landingId,
      filename: this.filename,
      contentType: this.contentType,
      sizeBytes: this.sizeBytes,
      storagePath: this.storagePath,
      createdAt: this.createdAt,
    };
  }

  // Business methods
  isHtmlFile(): boolean {
    return this.contentType === 'text/html' || this.filename.toLowerCase().endsWith('.html');
  }

  isCssFile(): boolean {
    return this.contentType === 'text/css' || this.filename.toLowerCase().endsWith('.css');
  }

  isJsFile(): boolean {
    return this.contentType === 'application/javascript' ||
           this.contentType === 'text/javascript' ||
           this.filename.toLowerCase().endsWith('.js');
  }

  isImageFile(): boolean {
    return this.contentType.startsWith('image/') ||
           /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(this.filename);
  }
}