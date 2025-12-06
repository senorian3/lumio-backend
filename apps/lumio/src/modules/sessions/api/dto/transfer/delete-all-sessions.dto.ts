export class DeleteAllSessionsDto {
  constructor(
    public userId: number,
    public deviceId: string,
  ) {}
}
