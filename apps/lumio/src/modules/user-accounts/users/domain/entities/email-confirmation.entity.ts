import { EmailConfirmation } from 'generated/prisma-lumio';
import { UserEntity } from './user.entity';

export class EmailConfirmationEntity implements EmailConfirmation {
  id: number;
  confirmationCode: string;
  expirationDate: Date;
  isConfirmed: boolean;
  userId: number;

  // обратная связь с User
  user?: UserEntity;
}
