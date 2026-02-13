import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { Post } from 'generated/prisma-lumio';

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(
    userId: number,
    postId: string,
    description: string,
    tx?: any,
  ): Promise<PostEntity> {
    const client = tx || this.prisma;
    const newPost = await client.post.create({
      data: { userId, description, id: postId },
      include: {
        user: true,
        files: true,
      },
    });

    return newPost;
  }

  async findById(postId: string): Promise<PostEntity | null> {
    return this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
        files: true,
      },
    });
  }

  async updateDescription(
    postId: string,
    description: string,
  ): Promise<PostEntity> {
    return await this.prisma.post.update({
      where: { id: postId },
      data: { description },
      include: {
        user: true,
        files: true,
      },
    });
  }

  async softDeletePostById(postId: string): Promise<void> {
    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
  }

  async getPostsWithPagination(
    skip: number,
    take: number,
  ): Promise<{ posts: (Post & { files: any[] })[]; totalCount: number }> {
    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          files: true,
        },
      }),
      this.prisma.post.count({
        where: { deletedAt: null },
      }),
    ]);

    return { posts, totalCount };
  }
}
