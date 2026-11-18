export class OrderDTO {
  orderId?: number;
  requestId?: number;
  offerId?: number;
  sellerId?: number;
  storeName?: string;
  prototypeId?: number;
  status?: string;
  amount?: number;
  currency?: string;
  deliveryDays?: number;
  quantity?: number;
  deliveryAddress?: string;
  conditions?: string;
  specifications?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}
