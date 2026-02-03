import { ScenarioMetadata } from '../../../domain/entities/scenario.entity';

export type SaveScenarioVersionUseCaseRequest = {
  projectId: string;
  content: string;
  metadata?: ScenarioMetadata;
};

export type SaveScenarioVersionUseCaseResponse = {
  scenario: {
    id: string;
    projectId: string;
    version: number;
    content: string;
    isGenerated: boolean;
    isEdited: boolean;
    metadata: ScenarioMetadata | null;
    createdAt: Date;
    updatedAt: Date;
  };
};



