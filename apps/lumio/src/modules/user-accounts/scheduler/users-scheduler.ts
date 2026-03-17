import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserRepository } from '../users/domain/infrastructure/user.repository';

@Injectable()
export class UserSchedulerService {
  constructor(private readonly userRepository: UserRepository) {}

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredUserRegistration() {
    await this.userRepository
      .deleteExpiredUserRegistration(new Date())
      .catch((error) => {
        throw error;
      });
  }
}
