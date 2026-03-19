export class AudioTranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioTranscriptionError';
  }
}
