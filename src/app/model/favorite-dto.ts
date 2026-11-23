import {ProductDTO} from './product-dto';

export class FavoriteDTO {
  favoriteId?: number;
  productId?: number;
  // El backend (FavoriteDTO de Spring) envía el producto en el campo "product"
  product?: ProductDTO;
}
