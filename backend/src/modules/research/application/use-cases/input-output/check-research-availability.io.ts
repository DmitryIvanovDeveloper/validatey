export interface CheckResearchAvailabilityRequest {
  readonly projectId: string;
}

export interface CheckResearchAvailabilityResponse {
  readonly available: boolean;
  readonly nextAvailableAt: Date | null;
  readonly timeUntilNext: number; // milliseconds
  readonly formattedTimeRemaining?: string;
}