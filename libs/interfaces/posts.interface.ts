import { IFileMetadata } from './files.interface';

export interface ICreatePostDto {
  title: string;
  content: string;
  userId: string;
  fileIds?: string[];
}

export interface IUpdatePostDto {
  title?: string;
  content?: string;
  userId: string;
}

export interface IPostResponse {
  id: string;
  title: string;
  content: string;
  userId: string;
  files: IFileMetadata[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostEvent {
  postId: string;
  userId: string;
  fileKeys: string[]; // Ключи файлов в S3
  timestamp: Date;
}
