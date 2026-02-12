export class ResearchDataCollectedEvent {
  constructor(
    public readonly projectId: string,
    public readonly dataType: 'market' | 'competitor' | 'autocomplete' | 'synthesis'
  ) {}
}