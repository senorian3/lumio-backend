import { Readable } from 'stream';

export const createMockMulterFile = (
  filename: string = 'test-image.jpg',
  mimetype: string = 'image/jpeg',
  size: number = 1024,
  buffer: Buffer = Buffer.from('test-content'),
): Express.Multer.File => ({
  fieldname: 'files',
  originalname: filename,
  encoding: '7bit',
  mimetype,
  buffer,
  size,
  destination: '/tmp',
  filename: filename,
  path: `/tmp/${filename}`,
  stream: Readable.from(buffer),
});

export const createMockAvatarFile = (): Express.Multer.File =>
  createMockMulterFile('avatar.jpg', 'image/jpeg', 512000);

export const createMockImageFiles = (
  count: number = 3,
): Express.Multer.File[] =>
  Array.from({ length: count }, (_, i) =>
    createMockMulterFile(`image-${i + 1}.jpg`, 'image/jpeg', 1024 * 1024),
  );

export const createMockInvalidFile = (): Express.Multer.File =>
  createMockMulterFile('test.txt', 'text/plain', 1024);

export const createMockPngFile = (
  filename: string = 'test-image.png',
  size: number = 1024,
  buffer: Buffer = Buffer.from('test-content'),
): Express.Multer.File =>
  createMockMulterFile(filename, 'image/png', size, buffer);
