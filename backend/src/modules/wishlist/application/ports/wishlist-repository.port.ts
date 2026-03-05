import ResultEx from '../../../../infrastructure/result/result';

export interface WishlistEntry {
  id: string;
  email: string;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWishlistEntryInput {
  email: string;
  projectId?: string | null;
}

export interface WishlistRepositoryPort {
  create(input: CreateWishlistEntryInput): Promise<ResultEx<WishlistEntry, Error>>;
  findByEmailAndProject(email: string, projectId: string | null): Promise<ResultEx<WishlistEntry | null, Error>>;
  count(projectId?: string | null): Promise<ResultEx<number, Error>>;
  findAll(limit?: number, offset?: number, projectId?: string | null): Promise<ResultEx<WishlistEntry[], Error>>;
}
