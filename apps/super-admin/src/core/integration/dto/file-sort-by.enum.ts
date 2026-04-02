import { registerEnumType } from '@nestjs/graphql';

export enum FileSortBy {
  DATE_ASC = 'DATE_ASC',
  DATE_DESC = 'DATE_DESC',
}

registerEnumType(FileSortBy, {
  name: 'FileSortBy',
  description: 'Сортировка файлов',
});
