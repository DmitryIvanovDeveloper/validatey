export type ListWishlistUseCaseRequest = {
  callerUserId: string;
};

export type ListWishlistUseCaseResponse = {
  wishlist: Array<{
    id: string;
    email: string;
    createdAt: Date;
  }>;
};