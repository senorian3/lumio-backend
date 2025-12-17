import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreatePostDto } from '@lumio/modules/posts/api/dto/input/create-post.input.dto';
import { FileValidationPipe } from '@lumio/core/pipe/validation/validation-file.pipe';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createPost(
    @UploadedFiles(FileValidationPipe)
    files: Array<Express.Multer.File>,
    @Body() body: CreatePostDto,
    @Req() req: any,
  ) {}
}
