import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { registrationInputDto } from '../input-dto/registration.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../../application/use-cases/register-user.usecase';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}
  @Post('registration')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() dto: registrationInputDto) {
    await this.commandBus.execute<RegisterUserCommand, void>(
      new RegisterUserCommand(dto),
    );
  }
}
