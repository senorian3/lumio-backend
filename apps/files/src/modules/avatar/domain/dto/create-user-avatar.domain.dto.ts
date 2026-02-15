export class CreateUserAvatarDto {
  constructor(
    public key: string,
    public url: string,
    public mimetype: string,
    public size: number,
    public userId?: number,
  ) {}
}
