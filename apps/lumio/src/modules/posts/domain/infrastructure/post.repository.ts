import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(params: {
    userId: number;
    description: string;
  }): Promise<number> {
    const { userId, description } = params;

    const newPost = await this.prisma.post.create({
      data: {
        userId,
        description,
      },
    });

    return newPost.id;
  }

  async findById(postId: number): Promise<PostEntity | null> {
    return this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
      },
    });
  }

  async updateDescription(postId: number, description: string): Promise<void> {
    await this.prisma.post.update({
      where: { id: postId },
      data: { description },
    });
  }

  async softDeletePostById(postId: number): Promise<void> {
    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
  }
}
