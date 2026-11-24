import { ProductDTO } from './product-dto';

export interface CartItemDTO {
  itemId: number;
  product: ProductDTO;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CartDTO {
  cartId: number;
  items: CartItemDTO[];
  total: number;
}
