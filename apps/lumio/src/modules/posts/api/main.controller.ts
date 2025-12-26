import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetMainPageQuery } from '../application/query/get-main-page.query-handelr';
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('/')
export class MainController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getMainPage(): Promise<number> {
    return await this.queryBus.execute<GetMainPageQuery, any>(
      new GetMainPageQuery(),
    );
  }
}
