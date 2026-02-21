import ResultEx from '../../../../infrastructure/result/result';

export interface WishlistEntry {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWishlistEntryInput {
  email: string;
}

export interface WishlistRepositoryPort {
  create(input: CreateWishlistEntryInput): Promise<ResultEx<WishlistEntry, Error>>;
  findByEmail(email: string): Promise<ResultEx<WishlistEntry | null, Error>>;
  count(): Promise<ResultEx<number, Error>>;
  findAll(limit?: number, offset?: number): Promise<ResultEx<WishlistEntry[], Error>>;
}
