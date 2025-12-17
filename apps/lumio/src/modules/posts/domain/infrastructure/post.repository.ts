import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';

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
}
