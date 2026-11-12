export class QuoteRequestDTO {
  requestId?: number;
  prototypeId?: number;
  prototype?: string;
  categoryId?: number;
  quantity?: number;
  deliveryAddress?: string;
  deliveryZone?: string;
  deliveryConditions?: string;
  specifications?: string;
  images?: Array<string>;
  status?: string;
  createdAt?: string;
  offerCount?: number;
}
