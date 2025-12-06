export class DeleteSessionDto {
  constructor(
    public userId: number,
    public userDeviceId: string,
    public paramDeviceId: string,
  ) {}
}
