import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OutputFileType } from '@libs/dto/output/file-output';
import { QueryFileRepository } from '../../domain/infrastructure/file.query.repository';

export class GetAllFilesByPostUserQuery {
  constructor(public readonly postId: string) {}
}

@QueryHandler(GetAllFilesByPostUserQuery)
export class GetAllFilesByPostUserQueryHandler implements IQueryHandler<
  GetAllFilesByPostUserQuery,
  OutputFileType[]
> {
  constructor(private readonly queryFileRepository: QueryFileRepository) {}

  async execute(query: GetAllFilesByPostUserQuery): Promise<OutputFileType[]> {
    const files = await this.queryFileRepository.getAllFilesByPostId(
      query.postId,
    );

    const mappedFiles = files.map(
      (file) =>
        new OutputFileType(file.id, file.url, file.postId, file.createdAt),
    );

    return mappedFiles;
  }
}
