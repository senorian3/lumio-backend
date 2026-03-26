import { Injectable } from '@nestjs/common';
import { PrismaService } from '@files/prisma/prisma.service';
import { PostFileEntity } from '../entities/post-file.entity';

@Injectable()
export class QueryFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllFilesByPostId(postId: string): Promise<PostFileEntity[]> {
    const files = await this.prisma.postFile.findMany({
      where: {
        postId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return files;
  }

  async getAllFilesByPostIds(postIds: string[]): Promise<PostFileEntity[]> {
    if (!postIds || postIds.length === 0) {
      return [];
    }

    const files = await this.prisma.postFile.findMany({
      where: {
        postId: {
          in: postIds,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return files;
  }

  async getAllFilesByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'date_desc',
  ): Promise<PostFileEntity[]> {
    const orderBy = this.mapSortByToOrderBy(sortBy);

    return this.prisma.postFile.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  private mapSortByToOrderBy(sortBy: string): { createdAt: 'asc' | 'desc' } {
    switch (sortBy) {
      case 'date_asc':
        return { createdAt: 'asc' };
      case 'date_desc':
      default:
        return { createdAt: 'desc' };
    }
  }
}
