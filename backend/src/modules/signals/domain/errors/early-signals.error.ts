export class EarlySignalsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EarlySignalsError';
  }
}

export class EarlySignalsLlmError extends EarlySignalsError {
  constructor(message: string) {
    super(`LLM analysis failed: ${message}`);
    this.name = 'EarlySignalsLlmError';
  }
}
