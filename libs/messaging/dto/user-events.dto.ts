export class UserCreatedEvent {
  constructor(
    public readonly userId: number,
    public readonly username: string,
    public readonly email: string,
    public readonly createdAt: Date,
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: number,
    public readonly username: string,
    public readonly email: string,
    public readonly updatedAt: Date,
  ) {}
}

export class UserDeletedEvent {
  constructor(
    public readonly userId: number,
    public readonly deletedAt: Date,
  ) {}
}
