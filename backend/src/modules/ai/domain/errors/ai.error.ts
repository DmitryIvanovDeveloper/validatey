export class AiModuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiModuleError';
    Object.setPrototypeOf(this, AiModuleError.prototype);
  }
}

export class MarketContextSuggestError extends AiModuleError {
  constructor(message: string) {
    super(message);
    this.name = 'MarketContextSuggestError';
    Object.setPrototypeOf(this, MarketContextSuggestError.prototype);
  }
}
