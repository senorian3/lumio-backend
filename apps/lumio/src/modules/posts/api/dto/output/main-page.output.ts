import { PostView } from './create-post.output';

export class MainPageView {
  constructor(
    public posts: PostView[],
    public lastRegisteredUsersCount: number,
  ) {}
}
