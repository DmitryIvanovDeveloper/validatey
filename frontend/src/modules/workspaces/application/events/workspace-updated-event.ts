export class WorkspaceUpdatedEvent {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly workspaceName: string
  ) {}
}