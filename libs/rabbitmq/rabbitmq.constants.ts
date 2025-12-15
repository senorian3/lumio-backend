export const RABBITMQ_CONFIG = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',

  exchanges: {
    files: 'files_exchange',
    posts: 'posts_exchange',
  },

  queues: {
    files: 'files_queue',
    posts: 'posts_queue',
  },

  routingKeys: {
    // RPC запросы от Lumio к Files
    FILES_UPLOAD: 'files.upload',
    FILES_DELETE: 'files.delete',
    FILES_GET_URLS: 'files.get.urls',

    // События от Lumio к Files
    POST_CREATED: 'post.created',
    POST_DELETED: 'post.deleted',
  },

  messagePatterns: {
    UPLOAD_FILES: 'files.upload',
    DELETE_FILES: 'files.delete',
    GET_FILE_URLS: 'files.get.urls',
    POST_CREATED: 'post.created',
    POST_DELETED: 'post.deleted',
  },
} as const;
