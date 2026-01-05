import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { lookup } from 'mime-types';
import { CoreConfig } from '@files/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PostFileEntity } from '../../modules/posts/domain/entities/post-file.entity';

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly urlExpirationTime: number = 60 * 60 * 24 * 7; // 1 week
  private readonly kmsKeyId: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly logger: AppLoggerService,
  ) {
    this.bucketName = this.coreConfig.s3BucketName;
    this.region = this.coreConfig.s3Region;
    this.endpoint = this.coreConfig.s3Endpoint;
    this.kmsKeyId = this.coreConfig.s3KmsKeyId;
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

      let fileBuffer: Buffer;
      if (Buffer.isBuffer(buffer)) {
        fileBuffer = buffer;
      } else if (buffer instanceof Uint8Array) {
        fileBuffer = Buffer.from(buffer);
      } else if (Array.isArray(buffer)) {
        fileBuffer = Buffer.from(buffer);
      } else {
        this.logger.error(
          `Unsupported buffer type for file ${originalname}: ${typeof buffer}`,
        );
        throw BadRequestDomainException.create(
          'File cannot be uploaded. Unsupported buffer type',
          'file',
        );
      }

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
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: this.kmsKeyId,
        });

        await this.s3.send(uploadCommand);

        const fileUrl = await this.generateSignedUrl(fileKey);

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

  async generateSignedUrl(
    fileKey: string,
    expiresIn: number = this.urlExpirationTime,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const signedUrl = await getSignedUrl(this.s3 as any, command, {
        expiresIn,
      });
      return signedUrl;
    } catch (error) {
      this.logger.error(
        `Error generating signed URL for ${fileKey}`,
        error?.stack,
        FilesService.name,
      );
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
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
