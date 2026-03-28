import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OutputFileType } from '@libs/dto/output/file-output';
import { QueryFileRepository } from '../../domain/infrastructure/file.query.repository';

export class GetAllFilesByPostIdsQuery {
  constructor(public readonly postIds: string[]) {}
}

@QueryHandler(GetAllFilesByPostIdsQuery)
export class GetAllFilesByPostIdsQueryHandler implements IQueryHandler<
  GetAllFilesByPostIdsQuery,
  OutputFileType[]
> {
  constructor(private readonly queryFileRepository: QueryFileRepository) {}

  async execute(query: GetAllFilesByPostIdsQuery): Promise<OutputFileType[]> {
    const files = await this.queryFileRepository.getAllFilesByPostIds(
      query.postIds,
    );

    const mappedFiles = files.map(
      (file) =>
        new OutputFileType(file.id, file.url, file.postId, file.createdAt),
    );

    return mappedFiles;
  }
}
