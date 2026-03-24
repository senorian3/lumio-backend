export interface FilesResponse {
  items: Array<{
    id: number;
    url: string;
    postId: string;
  }>;
  total: number;
  page: number;
  limit: number;
}
