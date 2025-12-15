export class InputUpdatePostDto {
  constructor(
    public userId: string,
    public postId: string,
    public title?: string,
    public content?: string,
    public addFileIds?: string[],
    public removeFileIds?: string[],
  ) {}
}
