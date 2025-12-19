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
        postId: +dto.postId,
      },
    });
  }

  async softDeleteFilesByPostId(postId: number): Promise<void> {
    const result = await this.prisma.postFile.updateMany({
      where: { postId },
      data: { deletedAt: new Date() },
    });
  }

  async findFilesByPostId(postId: number): Promise<PostFileEntity[]> {
    return this.prisma.postFile.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      take: 10,
    });
  }
}
