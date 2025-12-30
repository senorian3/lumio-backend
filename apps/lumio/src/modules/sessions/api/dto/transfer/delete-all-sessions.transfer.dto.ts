export class DeleteAllSessionsTransferDto {
  constructor(
    public userId: number,
    public deviceId: string,
  ) {}
}
