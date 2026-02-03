export type GetSurveyByTokenUseCaseRequest = {
  token: string;
};

export type GetSurveyByTokenUseCaseResponse = {
  invitation: {
    id: string;
    projectId: string;
    token: string;
    email: string | null;
    status: string;
    sentAt: Date | null;
    respondedAt: Date | null;
  };
  survey: {
    id: string;
    token: string;
    projectId: string;
    questions: Array<{
      id: string;
      type: 'scale' | 'open' | 'audio';
      text: string;
      required: boolean;
    }>;
    status: 'pending' | 'started' | 'completed' | 'expired';
    startedAt: Date | null;
    completedAt: Date | null;
  };
};



