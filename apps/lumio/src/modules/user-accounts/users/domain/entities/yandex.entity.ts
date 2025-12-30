import { Yandex } from 'generated/prisma-lumio';
import { UserEntity } from './user.entity';

export class YandexEntity implements Yandex {
  id: number;
  email: string;
  username: string;
  yandexId: string;

  userId: number;

  user: UserEntity;
}
