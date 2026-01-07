import { Injectable } from '@nestjs/common';
import { PrismaService } from '@files/prisma/prisma.service';
import { PostFileEntity } from '../entities/post-file.entity';

@Injectable()
export class QueryFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllFilesByPostId(postId: number): Promise<PostFileEntity[]> {
    const files = await this.prisma.postFile.findMany({
      where: {
        postId: postId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return files;
  }
}
