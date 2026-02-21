export interface WishlistEntry {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class WishlistEntity {
  private constructor(
    private readonly _id: string,
    private readonly _email: string,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static create(email: string): WishlistEntity {
    const now = new Date();
    return new WishlistEntity(
      crypto.randomUUID(),
      email.trim().toLowerCase(),
      now,
      now
    );
  }

  static fromData(data: WishlistEntry): WishlistEntity {
    return new WishlistEntity(
      data.id,
      data.email,
      data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)
    );
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  toData(): WishlistEntry {
    return {
      id: this._id,
      email: this._email,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
