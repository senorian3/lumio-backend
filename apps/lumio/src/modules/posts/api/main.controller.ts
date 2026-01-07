import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GetMainPageCommand } from '../application/queries/get-main-page.query-handler';
import { ApiGetMainPage } from '@lumio/core/decorators/swagger/main/get-main-page.decorator';

@UseGuards(ThrottlerGuard)
@Controller('/')
export class MainController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiGetMainPage()
  @HttpCode(HttpStatus.OK)
  async getMainPage(): Promise<number> {
    const mainPageData = await this.queryBus.execute<
      GetMainPageCommand,
      number
    >(new GetMainPageCommand());

    return mainPageData;
  }
}
