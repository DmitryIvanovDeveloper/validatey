export type RecordAuditEntryUseCaseRequest = {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type RecordAuditEntryUseCaseResponse = void;
