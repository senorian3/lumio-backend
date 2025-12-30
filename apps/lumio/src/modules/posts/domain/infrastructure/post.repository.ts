import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(userId: number, description: string): Promise<PostEntity> {
    const newPost = await this.prisma.post.create({
      data: { userId, description },
      include: {
        user: true,
      },
    });

    return newPost;
  }

  async findById(postId: number): Promise<PostEntity | null> {
    return this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
      },
    });
  }

  async updateDescription(
    postId: number,
    description: string,
  ): Promise<PostEntity> {
    return await this.prisma.post.update({
      where: { id: postId },
      data: { description },
      include: {
        user: true,
      },
    });
  }

  async softDeletePostById(postId: number): Promise<void> {
    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
  }

  async getLastPosts(take: number): Promise<PostEntity[]> {
    return this.prisma.post.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: true,
      },
    });
  }
}
