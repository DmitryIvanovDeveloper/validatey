export interface FileMetadata {
  readonly filename: string;
  readonly contentType: string;
  readonly size: number;
  readonly path: string;
  readonly url: string;
  readonly uploadedAt: Date;
}

export class FileMetadataVO {
  private constructor(
    private readonly _filename: string,
    private readonly _contentType: string,
    private readonly _size: number,
    private readonly _path: string,
    private readonly _url: string,
    private readonly _uploadedAt: Date
  ) {
    if (!_filename || _filename.trim().length === 0) {
      throw new Error('Filename is required');
    }
    if (_size < 0) {
      throw new Error('File size cannot be negative');
    }
  }

  static create(
    filename: string,
    contentType: string,
    size: number,
    path: string,
    url: string,
    uploadedAt?: Date
  ): FileMetadataVO {
    return new FileMetadataVO(filename, contentType, size, path, url, uploadedAt || new Date());
  }

  get filename(): string {
    return this._filename;
  }

  get contentType(): string {
    return this._contentType;
  }

  get size(): number {
    return this._size;
  }

  get path(): string {
    return this._path;
  }

  get url(): string {
    return this._url;
  }

  get uploadedAt(): Date {
    return this._uploadedAt;
  }

  toData(): FileMetadata {
    return {
      filename: this._filename,
      contentType: this._contentType,
      size: this._size,
      path: this._path,
      url: this._url,
      uploadedAt: this._uploadedAt,
    };
  }
}



