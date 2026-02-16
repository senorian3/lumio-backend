import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { lookup } from 'mime-types';
import { CoreConfig } from '@files/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PostFileEntity } from '../../modules/posts/domain/entities/post-file.entity';
import { validateAndConvertBuffer } from '../utils/buffer-validation.utils';

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly logger: AppLoggerService,
  ) {
    this.bucketName = this.coreConfig.s3BucketName;
    this.region = this.coreConfig.s3Region;
    this.endpoint = this.coreConfig.s3Endpoint;
    this.accessKeyId = this.coreConfig.s3AccessKeyId;
    this.secretAccessKey = this.coreConfig.s3SecretAccessKey;

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
      forcePathStyle: false,
    });
  }

  async uploadFiles(
    type: 'users' | 'posts',
    id: number,
    files: Array<{ buffer: any; originalname: string }>,
  ): Promise<PostFileEntity[]> {
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const { buffer, originalname } = files[i];

      const fileBuffer = validateAndConvertBuffer(
        buffer,
        originalname,
        this.logger,
      );

      const fileExtension = originalname.split('.').pop() || 'png';
      const mimeType = lookup(originalname) || 'image/png';
      const uniqueId = randomUUID().split('-')[0];
      const fileName = `${id}_image_${i + 1}_${uniqueId}.${fileExtension}`;
      const fileKey = `content/${type}/${id}/${fileName}`;

      try {
        const uploadCommand = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: mimeType,
        });

        await this.s3.send(uploadCommand);

        const fileUrl = `https://${this.bucketName}.storage.yandexcloud.net/${fileKey}`;

        uploadedFiles.push({
          key: fileKey,
          url: fileUrl,
          fileName: originalname,
          mimetype: mimeType,
          size: fileBuffer.length,
        });
      } catch (exception) {
        this.logger.error(
          `Error uploading file ${fileName}`,
          exception?.stack,
          FilesService.name,
        );
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
    } catch (error) {
      this.logger.error(
        `Error deleting file ${s3key}`,
        error?.stack,
        FilesService.name,
      );
      throw new Error(`Failed to delete file ${s3key}: ${error.message}`);
    }
  }
}
