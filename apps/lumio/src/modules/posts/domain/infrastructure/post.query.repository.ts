import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { PostEntity } from '@lumio/modules/posts/domain/entities/post.entity';

@Injectable()
export class PostQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(postId: number): Promise<PostEntity | null> {
    return this.prisma.post.findFirst({
      where: { id: postId },
      include: {
        user: true,
      },
    });
  }

  async findUserPosts(userId: number): Promise<PostEntity[]> {
    return this.prisma.post.findMany({
      where: { userId },
      include: {
        user: true,
      },
    });
  }
}
