import { EarlySignal } from '../../../domain/entities/early-signal.entity';

export type GetEarlySignalsByProjectIdUseCaseRequest = {
  projectId: string;
};

export type GetEarlySignalsByProjectIdUseCaseResponse = {
  signals: EarlySignal[];
};
