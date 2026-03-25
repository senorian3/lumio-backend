import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OutputFileType } from '@libs/dto/output/file-output';
import { QueryFileRepository } from '../../domain/infrastructure/file.query.repository';

export class GetAllFilesByUserIdQuery {
  constructor(
    public readonly userId: number,
    public readonly page: number = 1,
    public readonly limit: number = 50,
  ) {}
}

@QueryHandler(GetAllFilesByUserIdQuery)
export class GetAllFilesByUserIdQueryHandler implements IQueryHandler<
  GetAllFilesByUserIdQuery,
  OutputFileType[]
> {
  constructor(private readonly queryFileRepository: QueryFileRepository) {}

  async execute(query: GetAllFilesByUserIdQuery): Promise<OutputFileType[]> {
    const files = await this.queryFileRepository.getAllFilesByUserId(
      query.userId,
      query.page,
      query.limit,
    );

    const mappedFiles = files.map(
      (file) => new OutputFileType(file.id, file.url, file.postId),
    );

    return mappedFiles;
  }
}
