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
import { PostFileEntity } from '@files/modules/domain/entities/post-file.entity';

@Injectable()
export class FilesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint: string;
  private readonly urlExpirationTime: number = 3600;
  private readonly kmsKeyId: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(private readonly coreConfig: CoreConfig) {
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
    postId: number,
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
        console.error(`Error uploading file ${fileName}:`, exception);
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
      console.error(`Error generating signed URL for ${fileKey}:`, error);
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
      console.log(`File deleted: ${s3key}`);
    } catch (error) {
      console.error(`Error deleting file ${s3key}:`, error);
      throw new Error(`Failed to delete file ${s3key}: ${error.message}`);
    }
  }
}
