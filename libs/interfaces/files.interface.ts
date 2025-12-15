export interface IUploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface IUploadFilesRequest {
  files: IUploadFile[];
  userId: string;
  postId?: string;
}

export interface IUploadedFile {
  id: string;
  url: string;
  previewUrl?: string;
  originalname: string;
  mimetype: string;
  size: number;
  key: string; // S3 ключ
  uploadedAt: Date;
}

export interface IDeleteFilesRequest {
  fileKeys: string[];
  userId: string;
}

export interface IFileMetadata {
  id: string;
  url: string;
  originalname: string;
  size: number;
  mimetype: string;
  key: string;
}
