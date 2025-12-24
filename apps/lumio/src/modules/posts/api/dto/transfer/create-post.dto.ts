export class CreatePostTransferDto {
  constructor(
    public userId: number,
    public description: string,
    public files: Array<Express.Multer.File>,
  ) {}
}
