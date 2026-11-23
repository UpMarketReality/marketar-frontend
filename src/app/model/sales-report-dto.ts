export interface ProductSalesDTO {
  productId: number;
  name: string;
  unitsSold: number;
  netSalesAmount: number;
}

export interface SalesReportDTO {
  startDate: string;
  endDate: string;
  purchaseCount: number;
  unitsSold: number;
  netSalesAmount: number;
  currency: string;
  products: ProductSalesDTO[];
}
