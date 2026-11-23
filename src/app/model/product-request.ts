export class ProductRequest {
  name: string;
  description: string;
  categoryId: number;
  unitPrice: number;
  wholesalePrice?: number | null;
  dimensions: string;
  material: string;
  color: string;
  stock: number;
  retainedImageIds?: number[];
}
