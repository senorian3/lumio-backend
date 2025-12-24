export class InputUploadFilesType {
  constructor(
    public postId: string,
    public files: Array<Express.Multer.File>,
  ) {}
}
