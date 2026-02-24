export interface CheckResearchAvailabilityRequest {
  projectId: string;
}

export interface CheckResearchAvailabilityResponse {
  available: boolean;
  timeUntilNext: number;
  nextAvailableAt: Date | null;
  formattedTimeRemaining?: string;
}