export class CreateChatFileDomainDto {
  constructor(
    public key: string,
    public url: string,
    public type: string,
    public size: number,
    public userId: number,
    public chatId: number,
    public messageId: string,
    public originalName: string,
    public mimeType: string,
  ) {}
}
