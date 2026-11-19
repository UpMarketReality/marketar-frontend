export class PageDTO<T> {
  content?: Array<T>;
  page?: number;
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}
