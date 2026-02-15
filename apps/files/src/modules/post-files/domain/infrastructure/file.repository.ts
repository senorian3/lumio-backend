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

  async createFiles(dtos: CreateFileDomainDto[]): Promise<PostFileEntity[]> {
    const createPromises = dtos.map((dto) =>
      this.prisma.postFile.create({
        data: {
          key: dto.key,
          url: dto.url,
          mimetype: dto.mimetype,
          size: dto.size,
          postId: dto.postId,
        },
      }),
    );
    return Promise.all(createPromises);
  }

  async softDeleteFilesByPostId(postId: string): Promise<void> {
    await this.prisma.postFile.updateMany({
      where: { postId },
      data: { deletedAt: new Date() },
    });
  }

  async findFilesByPostId(postId: string): Promise<PostFileEntity[]> {
    return this.prisma.postFile.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      take: 10,
    });
  }

  async deleteFilesByIds(ids: number[]): Promise<void> {
    await this.prisma.postFile.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async updateFiles(
    updates: Array<{
      id: number;
      key: string;
      url: string;
      mimetype: string;
      size: number;
    }>,
  ): Promise<PostFileEntity[]> {
    const updatePromises = updates.map((update) =>
      this.prisma.postFile.update({
        where: { id: update.id },
        data: {
          key: update.key,
          url: update.url,
          mimetype: update.mimetype,
          size: update.size,
        },
      }),
    );
    return Promise.all(updatePromises);
  }
}
