export type ExecuteDeletionRequestUseCaseRequest = {
  requestId: string;
};

export type ExecuteDeletionRequestUseCaseResponse = {
  requestId: string;
  status: 'completed';
  completedAt: Date;
};
