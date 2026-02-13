import { PostFile } from 'generated/prisma-lumio';

export class PostFileEntity implements PostFile {
  id: number;
  postId: string;
  url: string;
  createdAt: Date;
  deletedAt: Date | null;
}
