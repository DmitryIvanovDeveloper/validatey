export class WishlistEntry {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly createdAt: Date,
    public readonly projectId: string | null = null
  ) {}

  static fromData(data: {
    id: string;
    email: string;
    createdAt: string | Date;
    projectId?: string | null;
  }): WishlistEntry {
    return new WishlistEntry(
      data.id,
      data.email,
      data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      data.projectId ?? null
    );
  }
}
