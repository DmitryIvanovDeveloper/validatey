// Allowed content types for landing files
export const ALLOWED_CONTENT_TYPES = [
  // HTML
  'text/html',

  // CSS
  'text/css',

  // JavaScript
  'application/javascript',
  'text/javascript',
  'application/x-javascript',

  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'image/x-icon',

  // Fonts
  'font/woff',
  'font/woff2',
  'application/font-woff',
  'application/font-woff2',

  // Other web assets
  'application/json',
  'text/plain',
  'text/xml',
] as const;

export type AllowedContentType = typeof ALLOWED_CONTENT_TYPES[number];

export class FileContentType {
  private constructor(private readonly _value: string) {
    if (!this.isAllowedType(_value)) {
      throw new Error(`Content type '${_value}' is not allowed for landing files`);
    }
  }

  static create(value: string): FileContentType {
    return new FileContentType(value.toLowerCase().trim());
  }

  private isAllowedType(value: string): boolean {
    return ALLOWED_CONTENT_TYPES.includes(value as AllowedContentType);
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  isHtml(): boolean {
    return this._value === 'text/html';
  }

  isCss(): boolean {
    return this._value === 'text/css';
  }

  isJavascript(): boolean {
    return ['application/javascript', 'text/javascript', 'application/x-javascript'].includes(this._value);
  }

  isImage(): boolean {
    return this._value.startsWith('image/');
  }

  isFont(): boolean {
    return this._value.startsWith('font/') || this._value.includes('font-');
  }

  equals(other: FileContentType): boolean {
    return this._value === other._value;
  }
}