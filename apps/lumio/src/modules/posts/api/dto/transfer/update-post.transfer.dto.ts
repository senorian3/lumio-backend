export class UpdatePostTransferDto {
  constructor(
    public postId: number,
    public userId: number,
    public description: string,
  ) {}
}
