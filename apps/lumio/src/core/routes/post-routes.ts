export const POST_BASE = 'posts';

export const POST_ROUTES = {
  GET_MY_POSTS: 'my',
  GET_USER_POSTS: ':userId',
  GET_PROFILE_POST: ':profileId',
  UPDATE_POST: ':postId',
  DELETE_POST: ':postId',
  GET_POST_BY_ID: 'post/:postId',
  CREATE_COMMENT: ':postId/comments',
  GET_POST_COMMENTS: ':postId/comments',
  LIKE_COMMENT: 'comments/:commentId/like',
  LIKE_POST: ':postId/like',
};
