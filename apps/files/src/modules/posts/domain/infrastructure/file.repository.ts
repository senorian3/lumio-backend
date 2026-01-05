import { Injectable } from '@nestjs/common';
import { PrismaService } from '@files/prisma/prisma.service';
import { PostFileEntity } from '../entities/post-file.entity';
import { CreateFileDomainDto } from '../dto/create-file.domain.dto';

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFile(dto: CreateFileDomainDto): Promise<PostFileEntity> {
    return await this.prisma.postFile.create({
      data: {
        key: dto.key,
        url: dto.url,
        mimetype: dto.mimetype,
        size: dto.size,
        postId: dto.postId,
      },
    });
  }

  async softDeleteFilesByPostId(postId: number): Promise<void> {
    await this.prisma.postFile.updateMany({
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
