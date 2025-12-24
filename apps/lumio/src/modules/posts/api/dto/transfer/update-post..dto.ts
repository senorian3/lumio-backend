export class UpdatePostDto {
  constructor(
    public postId: number,
    public userId: number,
    public description: string,
  ) {}
}
