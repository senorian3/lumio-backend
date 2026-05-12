import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';
import { LikePostStatus } from '@lumio/modules/posts/api/dto/input/like-post.input.dto';

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

  async findActivePostById(postId: string) {
    return this.prisma.post.findFirst({
      where: { id: postId.toString(), deletedAt: null },
    });
  }

  async updatePostLike(
    postId: string,
    userId: number,
    status: LikePostStatus,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (status === 'none') {
        await tx.postLike.deleteMany({
          where: { postId, userId },
        });
      } else {
        await tx.postLike.upsert({
          where: {
            postId_userId: { postId, userId },
          },
          create: {
            postId,
            userId,
            status,
          },
          update: {
            status,
          },
        });
      }

      const [likeCount, dislikeCount] = await Promise.all([
        tx.postLike.count({
          where: { postId, status: 'like' },
        }),
        tx.postLike.count({
          where: { postId, status: 'dislike' },
        }),
      ]);

      await tx.post.update({
        where: { id: postId.toString() },
        data: { likeCount, dislikeCount },
      });
    });
  }
}
