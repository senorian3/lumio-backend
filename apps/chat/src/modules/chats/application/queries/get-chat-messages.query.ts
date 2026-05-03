export class GetChatMessagesQuery {
  constructor(
    public readonly userId: number,
    public readonly recipientId: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
