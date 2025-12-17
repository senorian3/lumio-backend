import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryFileRepository } from '@files/domain/infrastructure/file.query.repository';
import { OutputFilesDto } from './../../../../../libs/rabbitmq/dto/output';

export class GetAllFilesByPostUserQuery {
  constructor(public readonly postId: number) {}
}

@QueryHandler(GetAllFilesByPostUserQuery)
export class GetAllFilesByPostUserQueryHandler implements IQueryHandler<
  GetAllFilesByPostUserQuery,
  OutputFilesDto[] | null
> {
  constructor(private readonly queryFileRepository: QueryFileRepository) {}

  async execute(
    query: GetAllFilesByPostUserQuery,
  ): Promise<OutputFilesDto[] | null> {
    const files = await this.queryFileRepository.getAllFileByPostId(
      query.postId,
    );

    const mappedFiles = files.map(
      (file) => new OutputFilesDto(file.id, file.url),
    );

    return mappedFiles;
  }
}
