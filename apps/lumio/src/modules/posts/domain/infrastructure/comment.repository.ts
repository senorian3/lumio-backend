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

  async findActiveCommentById(commentId: number) {
    return this.prisma.comment.findFirst({
      where: { id: commentId, deletedAt: null },
    });
  }

  private async resolveRootId(parentId?: number): Promise<number | null> {
    if (!parentId) return null;

    const parent = await this.prisma.comment.findFirst({
      where: { id: parentId, deletedAt: null },
      select: { id: true, rootId: true },
    });

    if (!parent) return null;

    return parent.rootId ?? parent.id;
  }

  async createComment(
    userId: number,
    postId: string,
    content: string,
    parentId?: number,
  ): Promise<{ commentId: number }> {
    const rootId = await this.resolveRootId(parentId);

    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
        ...(parentId && { parentId }),
        rootId,
      },
      select: { id: true },
    });

    return { commentId: comment.id };
  }
}
