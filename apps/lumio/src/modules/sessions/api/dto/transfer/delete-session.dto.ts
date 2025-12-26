export class DeleteSessionTransferDto {
  constructor(
    public userId: number,
    public userDeviceId: string,
    public paramDeviceId: string,
  ) {}
}
