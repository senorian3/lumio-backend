import { Test, TestingModule } from '@nestjs/testing';
import { PostSubscriptionResolver } from '@super-admin/modules/posts/api/post-subscription.resolver';
import { PostsSubscriptionService } from '@super-admin/modules/posts/application/posts-subscription.service';

describe('PostSubscriptionResolver', () => {
  let resolver: PostSubscriptionResolver;

  const mockPubSub = {
    asyncIterableIterator: jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: jest.fn(),
      }),
    }),
  };

  const mockPostsSubscriptionService = {
    pubSub: mockPubSub,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostSubscriptionResolver,
        {
          provide: PostsSubscriptionService,
          useValue: mockPostsSubscriptionService,
        },
      ],
    }).compile();

    resolver = module.get<PostSubscriptionResolver>(PostSubscriptionResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('postCreated', () => {
    it('should return async iterator from pubSub', () => {
      const result = resolver.postCreated();

      expect(result).toBeDefined();
      expect(mockPubSub.asyncIterableIterator).toHaveBeenCalledWith(
        'postCreated',
      );
    });
  });
});
