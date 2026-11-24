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
  private readonly apiUrl = `${environment.apiUrl}/v1`;
  private readonly http = inject(HttpClient);

  // COMPRADOR: consultar exclusivamente sus encargos personalizados.
  // GET /api/v1/orders/me?page=0&size=100
  getMyOrders(page: number = 0, size: number = 100): Observable<PageDTO<OrderDTO>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PageDTO<OrderDTO>>(`${this.apiUrl}/orders/me`, { params });
  }

  // COMPRADOR: obtener el detalle de uno de sus encargos.
  // GET /api/v1/orders/{orderId}
  getMyOrderById(orderId: number): Observable<OrderDTO> {
    return this.http.get<OrderDTO>(`${this.apiUrl}/orders/${orderId}`);
  }

  // VENDEDOR: conservar los métodos existentes sin modificar su contrato.
  // GET /api/v1/seller/orders
  getSellerOrders(page: number = 0, size: number = 50): Observable<PageDTO<OrderDTO>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PageDTO<OrderDTO>>(`${this.apiUrl}/seller/orders`, { params });
  }

  // GET /api/v1/seller/orders/{orderId}/specifications
  getSellerOrderSpecifications(orderId: number): Observable<OrderDTO> {
    return this.http.get<OrderDTO>(`${this.apiUrl}/seller/orders/${orderId}/specifications`);
  }

  // PATCH /api/v1/seller/orders/{orderId}/status
  updateSellerOrderStatus(orderId: number, status: string): Observable<OrderDTO> {
    return this.http.patch<OrderDTO>(`${this.apiUrl}/seller/orders/${orderId}/status`, { status });
  }
}
