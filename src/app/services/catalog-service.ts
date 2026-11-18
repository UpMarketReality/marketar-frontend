import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageDTO } from '../model/page-dto';
import { ProductDTO } from '../model/product-dto';
import { CategoryDTO } from '../model/category-dto';
import { StoreDTO } from '../model/store-dto';
import { StoreRequest } from '../model/store-request';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private apiUrl = environment.apiUrl;
  private http: HttpClient = inject(HttpClient);

  constructor() {}
  // US06 David K.
  // 1. GET /api/v1/products
  getProducts(
    search?: string,
    categoryId?: number,
    minPrice?: number,
    maxPrice?: number,
    page: number = 0,
    size: number = 20,
  ): Observable<PageDTO<ProductDTO>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
    if (categoryId !== undefined && categoryId !== null) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (minPrice !== undefined && minPrice !== null) {
      params = params.set('minPrice', minPrice.toString());
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      params = params.set('maxPrice', maxPrice.toString());
    }

    return this.http.get<PageDTO<ProductDTO>>(`${this.apiUrl}/products`, { params });
  }

  // 2. GET /api/v1/product-categories
  getProductCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.apiUrl}/product-categories`);
  }

  //US11 David K.
  // 3. GET /api/v1/seller/store
  getStore(): Observable<StoreDTO> {
    return this.http.get<StoreDTO>(`${this.apiUrl}/seller/store`);
  }

  // 4. UT /api/v1/seller/store
  updateStore(data: StoreRequest): Observable<StoreDTO> {
    return this.http.put<StoreDTO>(`${this.apiUrl}/seller/store`, data);
  }
}

