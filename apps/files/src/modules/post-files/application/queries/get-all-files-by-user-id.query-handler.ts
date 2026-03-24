import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OutputFileType } from '@libs/dto/output/file-output';
import { QueryFileRepository } from '../../domain/infrastructure/file.query.repository';

export class GetAllFilesByUserIdQuery {
  constructor(public readonly userId: number) {}
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
    );

    const mappedFiles = files.map(
      (file) => new OutputFileType(file.id, file.url, file.postId),
    );

    return mappedFiles;
  }
}
