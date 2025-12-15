export class OutputPostType {
  constructor(
    public id: string,
    public title: string,
    public content: string,
    public userId: string,
    // public files: FileMetadata[],
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
