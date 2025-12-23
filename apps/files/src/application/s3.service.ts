import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { lookup } from 'mime-types';
import { CoreConfig } from '@files/core/core.config';
import { PostFileEntity } from '@files/domain/entities/post-file.entity';

@Injectable()
export class FilesService {
  private s3: S3;
  private bucketName: string;
  private region: string;
  private endpoint: string;

  constructor(private readonly coreConfig: CoreConfig) {
    this.bucketName = this.coreConfig.s3BucketName;
    this.region = this.coreConfig.s3Region;
    this.endpoint = this.coreConfig.s3Endpoint;

    this.s3 = new S3({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }

  async uploadFiles(
    postId: number,
    files: Array<{ buffer: any; originalname: string }>,
  ): Promise<PostFileEntity[]> {
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const { buffer, originalname } = files[i];

      // Преобразуем buffer в Buffer, если нужно
      let fileBuffer: Buffer;
      if (Buffer.isBuffer(buffer)) {
        fileBuffer = buffer;
      } else if (
        buffer &&
        buffer.type === 'Buffer' &&
        Array.isArray(buffer.data)
      ) {
        // Это сериализованный Buffer (например, из JSON)
        fileBuffer = Buffer.from(buffer.data);
      } else if (buffer instanceof Uint8Array) {
        fileBuffer = Buffer.from(buffer);
      } else if (Array.isArray(buffer)) {
        fileBuffer = Buffer.from(buffer);
      } else {
        throw new Error(
          `Unsupported buffer type for file ${originalname}: ${typeof buffer}`,
        );
      }

      const fileExtension = originalname.split('.').pop() || 'png';
      const mimeType = lookup(originalname) || 'image/png';
      const uniqueId = randomUUID().split('-')[0];
      const fileName = `${postId}_image_${i + 1}_${uniqueId}.${fileExtension}`;
      const fileKey = `content/posts/${postId}/${fileName}`;

      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: mimeType,
          ACL: 'public-read',
        });

        await this.s3.send(command);

        const fileUrl = `https://storage.yandexcloud.net/${this.bucketName}/${fileKey}`;

        uploadedFiles.push({
          key: fileKey,
          url: fileUrl,
          fileName: originalname,
          mimeType,
          size: fileBuffer.length,
          index: i,
        });
      } catch (exception) {
        console.error(`Error uploading file ${fileName}:`, exception);
        throw new Error(
          `Failed to upload file ${originalname}: ${exception.message}`,
        );
      }
    }

    return uploadedFiles;
  }

  async deleteFile(s3key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3key,
      });

      await this.s3.send(command);
      console.log(`File deleted: ${s3key}`);
    } catch (error) {
      console.error(`Error deleting file ${s3key}:`, error);
      throw new Error(`Failed to delete file ${s3key}: ${error.message}`);
    }
  }
}
