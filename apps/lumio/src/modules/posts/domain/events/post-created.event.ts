export class PostCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly deletedAt: Date | null,
    public readonly userId: number,
    public readonly user: {
      id: number;
      username: string;
      email: string;
      createdAt: Date;
      isBlocked: boolean;
    },
    public readonly files: Array<{
      id: number;
      url: string;
      postId: string;
      createdAt: Date;
      deletedAt: Date | null;
    }>,
  ) {}
}
