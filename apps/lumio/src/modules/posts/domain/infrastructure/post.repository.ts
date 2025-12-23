import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(userId: number): Promise<string> {
    const newPost = await this.prisma.post.create({
      data: { userId },
    });

    return newPost.id.toString();
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
}
