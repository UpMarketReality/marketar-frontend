import { inject, Injectable, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateQuoteRequest } from '../model/create-quote-request';
import { PageDTO } from '../model/page-dto';
import { OfferRequest } from '../model/offer-request';
import { OfferDTO } from '../model/offer-dto';
import { OrderDTO } from '../model/order-dto';

class QuoteRequestDTO {}

@Injectable({
  providedIn: 'root',
})
export class QuoteService {
  private apiUrl = environment.apiUrl;
  private http: HttpClient = inject(HttpClient);

  constructor() {}

  // US23 (Andre realizado por David K.)
  // 1. POST /api/v1/quote-requests
  createQuoteRequest(request: CreateQuoteRequest): Observable<QuoteRequestDTO> {
    return this.http.post<QuoteRequestDTO>(`${this.apiUrl}/quote-requests`, request);
  }

  // US24 (Andre realizado por David K.)
  // 1. GET /api/v1/seller/quote-requests
  getOpenQuoteRequests(
    categoryId?: number,
    page: number = 0,
    size: number = 20,
  ): Observable<PageDTO<QuoteRequestDTO>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    if (categoryId !== undefined && categoryId !== null) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<PageDTO<QuoteRequestDTO>>(`${this.apiUrl}/seller/quote-requests`, {
      params,
    });
  }

  // 2. GET /api/v1/seller/quote-requests/{requestId}
  getSellerQuoteRequestDetail(requestId: number): Observable<QuoteRequestDTO> {
    return this.http.get<QuoteRequestDTO>(`${this.apiUrl}/seller/quote-requests/${requestId}`);
  }

  // 3. POST /api/v1/seller/quote-requests/{requestId}/offers
  createOffer(requestId: number, offerData: OfferRequest): Observable<OfferDTO> {
    return this.http.post<OfferDTO>(
      `${this.apiUrl}/seller/quote-requests/${requestId}/offers`,
      offerData,
    );
  }

  //US25 (Andre realizado por David K.)
  // 1. GET /api/v1/quote-requests/me
  getMyQuoteRequests(page: number = 0, size: number = 20): Observable<PageDTO<QuoteRequestDTO>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    return this.http.get<PageDTO<QuoteRequestDTO>>(`${this.apiUrl}/quote-requests/me`, { params });
  }

  // 2. GET /api/v1/quote-requests/{requestId}
  getMyQuoteRequestDetail(requestId: number): Observable<QuoteRequestDTO> {
    return this.http.get<QuoteRequestDTO>(`${this.apiUrl}/quote-requests/${requestId}`);
  }

  // 3. GET /api/v1/quote-requests/{requestId}/offers
  getOffersForRequest(requestId: number): Observable<OfferDTO[]> {
    return this.http.get<OfferDTO[]>(`${this.apiUrl}/quote-requests/${requestId}/offers`);
  }

  //US26 (Andre realizado por David K.)
  // 1. POST /api/v1/offers/{offerId}/accept
  acceptOffer(offerId: number): Observable<OrderDTO> {
    // Pasamos null como segundo argumento porque el endpoint en Java no pide @RequestBody
    return this.http.post<OrderDTO>(`${this.apiUrl}/offers/${offerId}/accept`, null);
  }

  //US27 (Andre realizado por David K.)
  // 1. PATCH /api/v1/quote-requests/{requestId}/cancel
  cancelQuoteRequest(requestId: number): Observable<QuoteRequestDTO> {
    return this.http.patch<QuoteRequestDTO>(
      `${this.apiUrl}/quote-requests/${requestId}/cancel`,
      null,
    );
  }
}
