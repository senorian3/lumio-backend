import { PostView } from './create-post.output.dto';

export class MainPageView {
  constructor(
    public posts: PostView[],
    public allRegisteredUsersCount: number,
  ) {}
}
