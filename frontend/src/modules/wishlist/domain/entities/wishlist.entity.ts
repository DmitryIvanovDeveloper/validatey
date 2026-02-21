export class WishlistEntry {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly createdAt: Date
  ) {}

  static fromData(data: {
    id: string;
    email: string;
    createdAt: string | Date;
  }): WishlistEntry {
    return new WishlistEntry(
      data.id,
      data.email,
      data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt)
    );
  }
}
