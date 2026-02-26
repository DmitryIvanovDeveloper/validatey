/** A single Product Hunt post (launch) from Algolia search. */
export interface ProductHuntPost {
  readonly name: string;
  readonly tagline: string;
  readonly url: string;
  readonly votesCount?: number;
  readonly description?: string | null;
}

/** Read-model block: Product Hunt launches relevant to the hypothesis (from Algolia search). */
export interface ProductHuntBlock {
  readonly posts: readonly ProductHuntPost[];
  readonly searchQuery: string;
  readonly fetchedAt: Date;
}
