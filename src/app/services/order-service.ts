import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderDTO } from '../model/order-dto';
import { PageDTO } from '../model/page-dto';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/v1`;
  private http: HttpClient = inject(HttpClient);

  // US09 (vendedor)
  // 1. GET /api/v1/seller/orders
  getSellerOrders(page: number = 0, size: number = 50): Observable<PageDTO<OrderDTO>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PageDTO<OrderDTO>>(`${this.apiUrl}/seller/orders`, { params });
  }

  // 2. GET /api/v1/seller/orders/{orderId}/specifications
  getSellerOrderSpecifications(orderId: number): Observable<OrderDTO> {
    return this.http.get<OrderDTO>(`${this.apiUrl}/seller/orders/${orderId}/specifications`);
  }

  // US29 (vendedor)
  // 3. PATCH /api/v1/seller/orders/{orderId}/status
  updateSellerOrderStatus(orderId: number, status: string): Observable<OrderDTO> {
    return this.http.patch<OrderDTO>(`${this.apiUrl}/seller/orders/${orderId}/status`, { status });
  }
}
