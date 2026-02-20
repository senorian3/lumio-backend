import { PrismaService } from '@lumio/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostFilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPostFiles(
    postId: string,
    files: Array<{ url: string }>,
    tx?: any,
  ): Promise<void> {
    const client = tx || this.prisma;
    await client.postFile.createMany({
      data: files.map((file) => ({ postId, url: file.url })),
    });
  }

  async deletePostFilesByPostId(postId: string): Promise<void> {
    await this.prisma.postFile.deleteMany({ where: { postId } });
  }
}
