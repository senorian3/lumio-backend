export class CreateFileDomainDto {
  constructor(
    public key: string,
    public url: string,
    public mimetype: string,
    public size: number,
    public postId: string,
  ) {}
}
