export class FileUploadedEvent {
  constructor(
    public readonly fileId: number,
    public readonly userId: number,
    public readonly filename: string,
    public readonly fileSize: number,
    public readonly filePath: string,
    public readonly uploadedAt: Date,
  ) {}
}

export class FileDeletedEvent {
  constructor(
    public readonly fileId: number,
    public readonly userId: number,
    public readonly filename: string,
    public readonly deletedAt: Date,
  ) {}
}

export class AvatarUpdatedEvent {
  constructor(
    public readonly userId: number,
    public readonly avatarFileId: number,
    public readonly avatarUrl: string,
    public readonly updatedAt: Date,
  ) {}
}
