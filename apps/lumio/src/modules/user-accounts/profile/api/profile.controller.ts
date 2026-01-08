import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PROFILE_BASE } from '@lumio/core/routs/routs';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { EditProfileInputDto } from '@lumio/modules/user-accounts/profile/api/dto/input/edit-profile.input-dto';
import { UpdateUserProfileCommand } from '@lumio/modules/user-accounts/profile/application/commands/update-user-profile.command-handler';

@Controller(PROFILE_BASE)
export class ProfileController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async editProfile(
    @Param('userId') userId: number,
    @Body() dto: EditProfileInputDto,
    @Req() req: any,
  ): Promise<void> {
    await this.commandBus.execute<UpdateUserProfileCommand, void>(
      new UpdateUserProfileCommand(dto, req.user.userId),
    );
  }
}
