export interface GetMarketContextSuggestionRequest {
  segmentDescription: string;
  segmentDemographics: string;
  productDescription?: string;
}

export interface GetMarketContextSuggestionResponse {
  marketPicture?: string;
  marketFit?: string;
  differentiation?: string;
}