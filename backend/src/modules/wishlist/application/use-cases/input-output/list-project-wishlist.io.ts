export interface ListProjectWishlistRequest {
  projectId: string;
  userId: string;
}

export interface ListProjectWishlistEntryDto {
  id: string;
  email: string;
  projectId: string | null;
  createdAt: string;
}

export interface ListProjectWishlistResponse {
  entries: ListProjectWishlistEntryDto[];
}
