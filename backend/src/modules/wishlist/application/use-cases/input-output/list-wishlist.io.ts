export interface ListWishlistUseCaseRequest {
  callerUserId: string;
}

export interface ListWishlistUseCaseResponse {
  wishlist: Array<{
    id: string;
    email: string;
    createdAt: Date;
  }>;
}