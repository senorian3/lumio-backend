import { Injectable } from '@nestjs/common';
import { PostFileEntity } from '@files/domain/entities/post-file.entity';
import { PrismaService } from '@files/prisma/prisma.service';

@Injectable()
export class QueryFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllFileByPostId(postId: number): Promise<PostFileEntity[]> {
    const files = await this.prisma.postFile.findMany({
      where: {
        postId: +postId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return files;
  }
}
