/** Read-model block: key competitors, prices, reviews (for Research Canvas). */
export interface CompetitorInfoBlock {
  readonly competitors?: readonly string[];
  readonly priceRange?: string;
  readonly rating?: string;
}
