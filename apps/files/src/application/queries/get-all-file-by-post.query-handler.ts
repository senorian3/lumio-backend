import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OutputFileByPostType } from '@files/api/dto/output/files-by-post.output-dto';
import { QueryFileRepository } from '@files/domain/infrastructure/file.query.repository';

export class GetAllFilesByPostUserQuery {
  constructor(public readonly postId: number) {}
}

@QueryHandler(GetAllFilesByPostUserQuery)
export class GetAllFilesByPostUserQueryHandler implements IQueryHandler<
  GetAllFilesByPostUserQuery,
  OutputFileByPostType[] | null
> {
  constructor(private readonly queryFileRepository: QueryFileRepository) {}

  async execute(
    query: GetAllFilesByPostUserQuery,
  ): Promise<OutputFileByPostType[] | null> {
    const files = await this.queryFileRepository.getAllFileByPostId(
      query.postId,
    );

    const mappedFiles = files.map(
      (file) => new OutputFileByPostType(file.id, file.url),
    );

    return mappedFiles;
  }
}
