import { IsArray, IsString } from 'class-validator';
export class InputGetUserPostsDto {
  @IsArray()
  @IsString({ each: true })
  postIds: string[];
}
