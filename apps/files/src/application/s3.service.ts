import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { lookup } from 'mime-types';

@Injectable()
export class FilesService {
  private s3: S3;
  private bucketName: string;
  private region: string;
  private publicEndpoint: string;
  private endpoint: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.region = process.env.S3_REGION;
    this.publicEndpoint = process.env.S3_PUBLIC_ENDPOINT;
    this.endpoint = process.env.S3_ENDPOINT;

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
    userId: number | string,
    postId: number | string,
    files: Array<{ buffer: Buffer; originalname: string }>,
  ) {
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const { buffer, originalname } = files[i];

      const fileExtension = originalname.split('.').pop() || 'png';
      const mimeType = lookup(originalname) || 'image/png';

      const uniqueId = randomUUID().split('-')[0];
      const fileName = `${postId}_image_${i + 1}_${uniqueId}.${fileExtension}`;
      const fileKey = `content/users/${userId}/posts/${postId}/${fileName}`;

      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: buffer,
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
          size: buffer.length,
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
}
