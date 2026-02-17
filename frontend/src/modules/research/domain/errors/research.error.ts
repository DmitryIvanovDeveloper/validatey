export class ResearchNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Research data not found for project ${projectId}`);
    this.name = 'ResearchNotFoundError';
  }
}

export class ResearchCollectError extends Error {
  constructor(message: string) {
    super(`Failed to collect research data: ${message}`);
    this.name = 'ResearchCollectError';
  }
}

export class ResearchSynthesisError extends Error {
  constructor(message: string) {
    super(`Failed to generate synthesis: ${message}`);
    this.name = 'ResearchSynthesisError';
  }
}

export interface CooldownErrorDetails {
  readonly type: 'COOLDOWN';
  readonly nextAvailableAt: string;
  readonly timeUntilNext: number;
  readonly formattedTimeRemaining: string;
}

export class ResearchCooldownError extends Error {
  public readonly nextAvailableAt: Date;
  public readonly timeUntilNext: number;
  public readonly type: 'COOLDOWN' = 'COOLDOWN';

  constructor(nextAvailableAt: string, timeUntilNext: number, formattedTimeRemaining?: string) {
    super(`Research can only be run once per day. Next available: ${formattedTimeRemaining || nextAvailableAt}`);
    this.name = 'ResearchCooldownError';
    this.nextAvailableAt = new Date(nextAvailableAt);
    this.timeUntilNext = timeUntilNext;
  }

  static formatTimeRemaining(milliseconds: number): string {
    const hours: number = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes: number = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds: number = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  toDetails(): CooldownErrorDetails {
    return {
      type: this.type,
      nextAvailableAt: this.nextAvailableAt.toISOString(),
      timeUntilNext: this.timeUntilNext,
      formattedTimeRemaining: ResearchCooldownError.formatTimeRemaining(this.timeUntilNext)
    };
  }
}