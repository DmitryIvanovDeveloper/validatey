export class ResearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResearchError';
  }
}

export class ResearchNotFoundError extends ResearchError {
  constructor(projectId: string) {
    super(`Research not found for project ${projectId}`);
    this.name = 'ResearchNotFoundError';
  }
}

export class ResearchDataCollectionError extends ResearchError {
  constructor(message: string) {
    super(message);
    this.name = 'ResearchDataCollectionError';
  }
}

export class SynthesisGenerationError extends ResearchError {
  constructor(message: string) {
    super(message);
    this.name = 'SynthesisGenerationError';
  }
}

// NEW: Domain Error для cooldown ограничения
export interface CooldownErrorData {
  readonly type: 'COOLDOWN';
  readonly nextAvailableAt: string;
  readonly timeUntilNext: number;
  readonly formattedTimeRemaining: string;
}

export class ResearchCooldownError extends ResearchError {
  public readonly nextAvailableAt: Date;
  public readonly timeUntilNext: number; // milliseconds

  constructor(nextAvailableAt: Date, timeUntilNext: number) {
    super(`Research can only be run once per day. Next available: ${ResearchCooldownError.formatTimeRemaining(timeUntilNext)}`);
    this.name = 'ResearchCooldownError';
    this.nextAvailableAt = nextAvailableAt;
    this.timeUntilNext = timeUntilNext;
  }

  // Helper method для удобного форматирования
  static formatTimeRemaining(milliseconds: number): string {
    const hours: number = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes: number = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds: number = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Преобразование для HTTP ответа
  toHttpResponse(): CooldownErrorData {
    return {
      type: 'COOLDOWN',
      nextAvailableAt: this.nextAvailableAt.toISOString(),
      timeUntilNext: this.timeUntilNext,
      formattedTimeRemaining: ResearchCooldownError.formatTimeRemaining(this.timeUntilNext)
    };
  }
}
