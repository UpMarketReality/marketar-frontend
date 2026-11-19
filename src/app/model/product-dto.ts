import { ImageDTO } from './image-dto';

export class ProductDTO {
  productId?: number;
  name?: string;
  description?: string;
  price?: number;
  wholesalePrice?: number;
  stock?: number;
  status?: string;
  dimensions?: string;
  material?: string;
  color?: string;
  categoryId?: number;
  sellerId?: number;
  storeName?: string;
  mainImageUrl?: string;
  images?: ImageDTO[];

  // Posibles adiciones pero se necesitaria cambiar el service relacionado
  rating?: number;
  reviewCount?: number;
}
