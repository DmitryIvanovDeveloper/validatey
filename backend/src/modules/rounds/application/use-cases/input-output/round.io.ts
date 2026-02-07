import type { RoundType } from '../../../domain/entities/round.entity';
import type { RoundResults } from '../../../domain/entities/round.entity';

export type CreateRoundRequest = {
  projectId: string;
  parentRoundId?: string | null;
  title: string;
  type: RoundType;
  sortOrder?: number;
};

export type ListRoundsByProjectRequest = {
  projectId: string;
};

export type GetRoundRequest = {
  projectId: string;
  roundId: string;
};

export type UpdateRoundRequest = {
  projectId: string;
  roundId: string;
  title?: string;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  type?: RoundType;
  sortOrder?: number;
  results?: RoundResults | null;
};

export type DeleteRoundRequest = {
  projectId: string;
  roundId: string;
};

export type RoundViewDTO = {
  id: string;
  projectId: string;
  parentRoundId: string | null;
  title: string;
  status: string;
  type: string;
  sortOrder: number;
  results: RoundResults | null;
  createdAt: string;
  updatedAt: string;
};
