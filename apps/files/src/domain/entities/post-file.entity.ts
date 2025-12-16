import { PostFile } from 'generated/prisma-files';

export class PostFileEntity implements PostFile {
  id: number;
  key: string;
  url: string;
  mimetype: string;
  size: number;
  createdAt: Date;
  userId: number;
  postId: number;
}
