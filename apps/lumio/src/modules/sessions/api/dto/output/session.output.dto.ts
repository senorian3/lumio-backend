export class OutputSessionDto {
  constructor(
    public deviceName: string,
    public ip: string,
    public lastActiveDate: string,
  ) {}
}
