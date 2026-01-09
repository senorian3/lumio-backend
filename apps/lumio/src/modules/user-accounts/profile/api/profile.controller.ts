import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PROFILE_BASE } from '@lumio/core/routs/routs';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { InputEditProfileDto } from '@lumio/modules/user-accounts/profile/api/dto/input/edit-profile.input.dto';
import { UpdateUserProfileCommand } from '@lumio/modules/user-accounts/profile/application/commands/update-user-profile.command-handler';
import { ProfileView } from './dto/output/profile.output.dto';
import { GetProfileQuery } from '../application/queries/get-profile.query-handler';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@libs/core/pipe/validation/validation-file.pipe';

@Controller(PROFILE_BASE)
export class ProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @Param('userId') userId: number,
    @Query('postId') postId?: number,
  ): Promise<ProfileView | PostView> {
    const profile = await this.queryBus.execute<GetProfileQuery, ProfileView>(
      new GetProfileQuery(userId, postId),
    );

    return profile;
  }

  @Put(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async editProfile(
    @Param('userId') userId: number,
    @Body() dto: InputEditProfileDto,
    @Req() req: any,
  ): Promise<ProfileView> {
    const updatedProfile = await this.commandBus.execute<
      UpdateUserProfileCommand,
      ProfileView
    >(new UpdateUserProfileCommand(dto, userId, req.user.userId));

    return updatedProfile;
  }

  @Post('/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('avatar'))
  async uploadUserAvatar(
    @Req() req: any,
    @UploadedFiles(FileValidationPipe) avatar: Array<Express.Multer.File>,
  ): Promise<void> {}
}
