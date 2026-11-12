export class PageDTO<T> {
  content?: Array<T>;
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}
