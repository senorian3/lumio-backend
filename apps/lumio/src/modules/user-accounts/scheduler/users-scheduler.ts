import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserRepository } from '../users/domain/infrastructure/user.repository';

@Injectable()
export class UserSchedulerService {
  constructor(private readonly userRepository: UserRepository) {}

  @Cron('0 * * * *')
  async deleteExpiredUserRegistration(): Promise<void> {
    const date = new Date();
    await this.userRepository.deleteExpiredUserRegistration(date);
  }
}
