import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryFileRepository } from '@files/domain/infrastructure/file.query.repository';
import { OutputFileType } from '@libs/dto/ouput/file-ouput';

export class GetAllFilesByPostUserQuery {
  constructor(public readonly postId: number) {}
}

@QueryHandler(GetAllFilesByPostUserQuery)
export class GetAllFilesByPostUserQueryHandler implements IQueryHandler<
  GetAllFilesByPostUserQuery,
  OutputFileType[] | null
> {
  constructor(private readonly queryFileRepository: QueryFileRepository) {}

  async execute(
    query: GetAllFilesByPostUserQuery,
  ): Promise<OutputFileType[] | null> {
    const files = await this.queryFileRepository.getAllFileByPostId(
      query.postId,
    );

    const mappedFiles = files.map(
      (file) => new OutputFileType(file.id, file.url, file.postId),
    );

    return mappedFiles;
  }
}
