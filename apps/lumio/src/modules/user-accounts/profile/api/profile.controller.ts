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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { InputEditProfileDto } from '@lumio/modules/user-accounts/profile/api/dto/input/edit-profile.input.dto';
import { UpdateProfileCommand } from '@lumio/modules/user-accounts/profile/application/commands/update-profile.command-handler';
import { ProfileView } from './dto/output/profile.output.dto';
import { GetProfileOrPostQuery } from '../application/queries/get-profile-or-post.query-handler';
import { PostView } from '@lumio/modules/posts/api/dto/output/post.output.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadUserAvatarCommand } from '@lumio/modules/user-accounts/profile/application/commands/upload-avatar.command-handler';
import { InputFillProfileDto } from './dto/input/fill-profile.input.dto';
import { FillProfileCommand } from '../application/commands/fill-profile.command-handler';
import {
  PROFILE_BASE,
  PROFILE_ROUTES,
} from '@lumio/core/routes/profile-routes';
import { ApiGetProfileOrPost } from '@lumio/core/decorators/swagger/profile/get-profile-or-post.decorator';
import { ApiFillProfile } from '@lumio/core/decorators/swagger/profile/fill-profile.decorator';
import { ApiUpdateProfile } from '@lumio/core/decorators/swagger/profile/edit-profile.decorator';
import { SingleFileValidationPipe } from '@libs/core/pipe/validation/validation-file.pipe';

@Controller(PROFILE_BASE)
export class ProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':userId')
  @ApiGetProfileOrPost()
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @Param('userId') userId: number,
    @Query('postId') postId?: number,
  ): Promise<ProfileView | PostView> {
    const profileOrPost = await this.queryBus.execute<
      GetProfileOrPostQuery,
      ProfileView | PostView
    >(new GetProfileOrPostQuery(userId, postId));

    return profileOrPost;
  }

  @Post(PROFILE_ROUTES.UPLOAD_AVATAR)
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadUserAvatar(
    @Req() req: any,
    @UploadedFile(SingleFileValidationPipe) avatar: Express.Multer.File,
  ): Promise<{ url: string }> {
    const avatarUrl = await this.commandBus.execute<
      UploadUserAvatarCommand,
      { url: string }
    >(new UploadUserAvatarCommand(req.user.userId, avatar));

    return avatarUrl;
  }

  @Put(PROFILE_ROUTES.FILL_PROFILE)
  @ApiFillProfile()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async fillProfile(
    @Param('userId') userId: number,
    @Body() dto: InputFillProfileDto,
    @Req() req: any,
  ): Promise<ProfileView> {
    const filledProfile = await this.commandBus.execute<
      FillProfileCommand,
      ProfileView
    >(new FillProfileCommand(dto, userId, req.user.userId));

    return filledProfile;
  }

  @Put(':userId')
  @ApiUpdateProfile()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param('userId') userId: number,
    @Body() dto: InputEditProfileDto,
    @Req() req: any,
  ): Promise<ProfileView> {
    const updatedProfile = await this.commandBus.execute<
      UpdateProfileCommand,
      ProfileView
    >(new UpdateProfileCommand(dto, userId, req.user.userId));

    return updatedProfile;
  }
}
