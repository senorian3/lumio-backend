import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiGetMainPage } from '@lumio/core/decorators/swagger/main/get-main-page.decorator';
import { GetMainPageQuery } from '@lumio/modules/posts/application/queries/get-main-page.query-handler';
import { GetMainPageInputDto } from '@lumio/modules/posts/api/dto/input/get-main-page.input.dto';
import { MainPageView } from './dto/output/main-page.output.dto';
import { OptionalJwtAuthGuard } from '@lumio/core/guards/bearer/jwt-optional-auth.guard';
import { OptionalUserId } from '@lumio/core/decorators/optional-user-id.decorator';

@UseGuards(ThrottlerGuard)
@Controller('/')
export class MainController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiGetMainPage()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMainPage(
    @Query() queryParams: GetMainPageInputDto,
    @OptionalUserId() currentUserId: number | null,
  ): Promise<MainPageView> {
    return await this.queryBus.execute(
      new GetMainPageQuery(currentUserId, queryParams),
    );
  }
}
