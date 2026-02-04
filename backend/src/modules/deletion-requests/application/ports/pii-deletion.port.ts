import ResultEx from '../../../../infrastructure/result/result';

/** Anonymizes or removes PII for a given deletion request. Implemented in infrastructure (e.g. clear invitation email/phone). */
export interface PiiDeletionPort {
  executeByRequestId(requestId: string): Promise<ResultEx<void, Error>>;
}
