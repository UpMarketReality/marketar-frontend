import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SalesReportDTO } from '../model/sales-report-dto';
import { OffersReportDTO } from '../model/offers-report-dto';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private http: HttpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/v1/seller/reports';

  // US10 - Escenario 1: ventas de catálogo del período
  // GET /api/v1/seller/reports/sales
  getSales(startDate: string, endDate: string): Observable<SalesReportDTO> {
    return this.http.get<SalesReportDTO>(`${this.apiUrl}/sales`, {
      params: this.periodo(startDate, endDate),
    });
  }

  // US10 - Escenario 2: ofertas y encargos del período
  // GET /api/v1/seller/reports/offers
  getOffers(startDate: string, endDate: string): Observable<OffersReportDTO> {
    return this.http.get<OffersReportDTO>(`${this.apiUrl}/offers`, {
      params: this.periodo(startDate, endDate),
    });
  }

  private periodo(startDate: string, endDate: string): HttpParams {
    return new HttpParams().set('startDate', startDate).set('endDate', endDate);
  }
}
