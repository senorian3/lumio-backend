import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findExistingAndActivePost(postId: string) {
    return this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
    });
  }

  async createComment(
    userId: number,
    postId: string,
    content: string,
  ): Promise<{ commentId: number }> {
    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
      select: { id: true },
    });

    return { commentId: comment.id };
  }
}
