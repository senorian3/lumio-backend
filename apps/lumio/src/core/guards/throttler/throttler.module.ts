import { ThrottlerModule } from '@nestjs/throttler';
import { CoreConfig } from '../../core.config';

export const throttlerModule = ThrottlerModule.forRootAsync({
  imports: [],
  inject: [CoreConfig],
  useFactory: (coreConfig: CoreConfig) => [
    {
      ttl: coreConfig.throttlerTtl,
      limit: coreConfig.throttlerLimit,
    },
  ],
});
