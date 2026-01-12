import { PipeTransform, Injectable } from '@nestjs/common';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

@Injectable()
export class SingleFileValidationPipe implements PipeTransform {
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
  private readonly ALLOWED_EXTENSIONS = ['jpeg', 'png'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_SIZE_READABLE = '10MB';

  transform(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file || !(file instanceof Object)) {
      throw BadRequestDomainException.create('No file uploaded', 'file');
    }

    if (!file.originalname || typeof file.size !== 'number') {
      throw BadRequestDomainException.create(
        'Uploaded file is corrupted or missing required metadata',
        'file',
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw BadRequestDomainException.create(
        `File "${file.originalname}" exceeds maximum size of ${this.MAX_SIZE_READABLE}`,
        'file',
      );
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw BadRequestDomainException.create(
        `File "${file.originalname}" has invalid MIME type (${file.mimetype}). Only JPEG and PNG files are allowed`,
        'file',
      );
    }

    const extension = this.getFileExtension(file.originalname);
    if (!extension || !this.ALLOWED_EXTENSIONS.includes(extension)) {
      throw BadRequestDomainException.create(
        `File "${file.originalname}" has invalid extension (.${extension || 'none'}). Only .jpg, .jpeg, and .png are allowed`,
        'file',
      );
    }

    if (!this.isMimeExtensionConsistent(file.mimetype, extension)) {
      throw BadRequestDomainException.create(
        `File "${file.originalname}" has mismatched MIME type and extension`,
        'file',
      );
    }

    return file;
  }

  private getFileExtension(filename: string): string | null {
    if (!filename || filename.trim() === '') return null;

    const parts = filename.split('.');
    if (parts.length === 1) return null;

    if (parts[0] === '' && parts.length === 2) return null;

    return parts.pop()?.toLowerCase() || null;
  }

  private isMimeExtensionConsistent(
    mimetype: string,
    extension: string,
  ): boolean {
    const mimeMap: Record<string, string[]> = {
      'image/jpeg': ['jpeg'],
      'image/png': ['png'],
    };

    return mimeMap[mimetype]?.includes(extension) || false;
  }
}
