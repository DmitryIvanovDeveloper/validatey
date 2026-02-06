export type ListUsersUseCaseRequest = {
  callerUserId: string;
};

export type ListUsersUseCaseResponse = {
  users: Array<{
    id: string;
    email: string | null;
    displayName: string | null;
  }>;
};
