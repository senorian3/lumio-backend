export class InputCreatePostDto {
  constructor(
    public title: string,
    public content: string,
    public userId: string,
    public fileIds?: string[], // ID файлов, загруженных заранее) {}
  ) {}
}
