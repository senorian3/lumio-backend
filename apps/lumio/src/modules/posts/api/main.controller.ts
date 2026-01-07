import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiGetMainPage } from '@lumio/core/decorators/swagger/main/get-main-page.decorator';
import { GetMainPageQuery } from '@lumio/modules/posts/application/queries/get-main-page.query-handler';

@UseGuards(ThrottlerGuard)
@Controller('/')
export class MainController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiGetMainPage()
  @HttpCode(HttpStatus.OK)
  async getMainPage(): Promise<number> {
    const mainPageData = await this.queryBus.execute<GetMainPageQuery, number>(
      new GetMainPageQuery(),
    );

    return mainPageData;
  }
}
