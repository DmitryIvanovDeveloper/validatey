export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export class InvalidAudioFileError extends TranscriptionError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAudioFileError';
  }
}

export class AudioFileTooLargeError extends TranscriptionError {
  constructor(maxBytes: number) {
    super(`Audio file exceeds maximum size of ${maxBytes} bytes`);
    this.name = 'AudioFileTooLargeError';
  }
}

export class SpeechToTextProviderError extends TranscriptionError {
  constructor(message: string) {
    super(message);
    this.name = 'SpeechToTextProviderError';
  }
}

export class TranscriptionPersistenceError extends TranscriptionError {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionPersistenceError';
  }
}

export class ProjectTranscriptionNotFoundError extends TranscriptionError {
  constructor(public readonly transcriptionId: string) {
    super(`Transcription not found: ${transcriptionId}`);
    this.name = 'ProjectTranscriptionNotFoundError';
  }
}

export class NoTranscriptionsForInsightsError extends TranscriptionError {
  constructor(projectId: string) {
    super(`No transcriptions found for project: ${projectId}`);
    this.name = 'NoTranscriptionsForInsightsError';
  }
}

export class TranscriptionInsightsGenerationError extends TranscriptionError {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionInsightsGenerationError';
  }
}

export class TranscriptionInsightsPersistenceError extends TranscriptionError {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionInsightsPersistenceError';
  }
}
