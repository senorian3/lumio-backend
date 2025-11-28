import { ThrottlerModule } from '@nestjs/throttler';

export const throttlerModule = ThrottlerModule.forRoot([
  {
    ttl: 10000,
    limit: 5,
  },
]);
