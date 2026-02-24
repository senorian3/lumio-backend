import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { GetProfileQuery } from '../application/queries/get-profile.query-handler';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadUserAvatarCommand } from '@lumio/modules/user-accounts/profile/application/commands/upload-avatar.command-handler';
import { InputFillProfileDto } from './dto/input/fill-profile.input.dto';
import { FillProfileCommand } from '../application/commands/fill-profile.command-handler';
import { DeleteUserAvatarCommand } from '../application/commands/delete-avatar.command-handler';
import {
  PROFILE_BASE,
  PROFILE_ROUTES,
} from '@lumio/core/routes/profile-routes';
import { ApiGetProfile } from '@lumio/core/decorators/swagger/profile/get-profile.decorator';
import { ApiFillProfile } from '@lumio/core/decorators/swagger/profile/fill-profile.decorator';
import { ApiUpdateProfile } from '@lumio/core/decorators/swagger/profile/edit-profile.decorator';
import { SingleFileValidationPipe } from '@libs/core/pipe/validation/validation-file.pipe';
import { ApiUploadUserAvatar } from '@lumio/core/decorators/swagger/profile/upload-avatar.decorator';
import { ApiDeleteUserAvatar } from '@lumio/core/decorators/swagger/profile/delete-avatar.decorator';

@Controller(PROFILE_BASE)
export class ProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':userId')
  @ApiGetProfile()
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<ProfileView> {
    return await this.queryBus.execute<GetProfileQuery, ProfileView>(
      new GetProfileQuery(userId),
    );
  }

  @Post(PROFILE_ROUTES.UPLOAD_AVATAR)
  @ApiUploadUserAvatar()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadUserAvatar(
    @Req() req: any,
    @UploadedFile(SingleFileValidationPipe) avatar: Express.Multer.File,
  ): Promise<{ url: string }> {
    return await this.commandBus.execute<
      UploadUserAvatarCommand,
      { url: string }
    >(new UploadUserAvatarCommand(req.user.userId, avatar));
  }

  @Put(PROFILE_ROUTES.FILL_PROFILE)
  @ApiFillProfile()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async fillProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: InputFillProfileDto,
    @Req() req: any,
  ): Promise<ProfileView> {
    return await this.commandBus.execute<FillProfileCommand, ProfileView>(
      new FillProfileCommand(dto, userId, req.user.userId),
    );
  }

  @Put(':userId')
  @ApiUpdateProfile()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: InputEditProfileDto,
    @Req() req: any,
  ): Promise<ProfileView> {
    return await this.commandBus.execute<UpdateProfileCommand, ProfileView>(
      new UpdateProfileCommand(dto, userId, req.user.userId),
    );
  }

  @Delete(PROFILE_ROUTES.DELETE_AVATAR)
  @ApiDeleteUserAvatar()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteUserAvatar(@Req() req: any): Promise<void> {
    return await this.commandBus.execute(
      new DeleteUserAvatarCommand(req.user.userId),
    );
  }
}
