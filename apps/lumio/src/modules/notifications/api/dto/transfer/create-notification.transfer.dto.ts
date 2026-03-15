export class CreateNotificationDto {
  constructor(
    public userId: number,
    public type: string,
    public title: string,
    public message: string,
    public executeAt: string,
  ) {}
}
