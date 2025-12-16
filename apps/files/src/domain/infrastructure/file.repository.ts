import { Injectable } from '@nestjs/common';
import { CreateFileDomainDto } from '@files/domain/dto/create-file.domain.dto';
import { PostFileEntity } from '@files/domain/entities/post-file.entity';
import { PrismaService } from '@files/prisma/prisma.service';

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFile(dto: CreateFileDomainDto): Promise<PostFileEntity> {
    return this.prisma.postFile.create({
      data: {
        key: dto.key,
        url: dto.url,
        mimetype: dto.mimetype,
        size: dto.size,
        userId: dto.userId,
        postId: dto.postId,
      },
    });
  }
}
