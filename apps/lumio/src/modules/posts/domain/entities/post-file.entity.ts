import { PostFile } from 'generated/prisma-lumio';

export class PostFileEntity implements PostFile {
  id: number;
  postId: number;
  url: string;
  createdAt: Date;
  deletedAt: Date | null;
}
