import { PipeTransform, Injectable } from '@nestjs/common';
import { Express } from 'express';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
  ];
  private readonly MAX_FILES = 10;
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  transform(files: Array<Express.Multer.File>): Array<Express.Multer.File> {
    if (!files || files.length === 0) {
      throw BadRequestDomainException.create('No files uploaded', 'file');
    }

    if (files.length > this.MAX_FILES) {
      throw BadRequestDomainException.create(
        `Maximum ${this.MAX_FILES} files allowed, but received ${files.length}`,
        'file',
      );
    }

    // Проверка каждого файла
    files.forEach((file, index) => {
      // Проверка размера файла
      if (file.size > this.MAX_FILE_SIZE) {
        throw BadRequestDomainException.create(
          `File ${index + 1} (${file.originalname}) exceeds maximum size of 20MB`,
          'file',
        );
      }

      // Проверка MIME-типа файла
      if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw BadRequestDomainException.create(
          `File ${index + 1} (${file.originalname}) has invalid type. Only JPEG and PNG files are allowed`,
          'file',
        );
      }

      // Дополнительная проверка по расширению файла
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png'];

      if (fileExtension && !validExtensions.includes(fileExtension)) {
        throw BadRequestDomainException.create(
          `File ${index + 1} (${file.originalname}) has invalid extension. Only .jpg, .jpeg, and .png are allowed`,
          'file',
        );
      }
    });

    return files;
  }
}
