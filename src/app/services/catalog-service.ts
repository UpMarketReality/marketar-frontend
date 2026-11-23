import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { MOCK_CATEGORIES, findMockProduct, mockProductsPage } from '../data/mock-data';
import { PageDTO } from '../model/page-dto';
import { ProductDTO } from '../model/product-dto';
import { CategoryDTO } from '../model/category-dto';
import { StoreDTO } from '../model/store-dto';
import { StoreRequest } from '../model/store-request';
import { ProductRequest } from '../model/product-request';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  // Todas las rutas del backend cuelgan de /api/v1
  private apiUrl = environment.apiUrl + '/v1';
  private http: HttpClient = inject(HttpClient);
  private useMock = environment.useMockData;

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
    if (this.useMock) {
      return of(mockProductsPage(search, categoryId, minPrice, maxPrice, page, size));
    }

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
    if (this.useMock) return of(MOCK_CATEGORIES);
    return this.http.get<CategoryDTO[]>(`${this.apiUrl}/product-categories`);
  }

  // US07 Cristopher P. (Realizado por David K.)
  // 2. GET /api/v1/products/{productId}
  getPublicProductById(productId: number): Observable<ProductDTO> {
    if (this.useMock) {
      const product = findMockProduct(productId);
      return product ? of(product) : throwError(() => new Error('Producto no encontrado'));
    }
    return this.http.get<ProductDTO>(`${this.apiUrl}/products/${productId}`);
  }

  // US11 David K.
  // 1. GET /api/v1/seller/store
  getStore(): Observable<StoreDTO> {
    return this.http.get<StoreDTO>(`${this.apiUrl}/seller/store`);
  }

  // 2. PUT /api/v1/seller/store
  updateStore(data: StoreRequest): Observable<StoreDTO> {
    return this.http.put<StoreDTO>(`${this.apiUrl}/seller/store`, data);
  }

  // US08 - POST /api/v1/seller/products
  // Envío multipart: "data" con el JSON del producto y "images" con las imágenes
  createProduct(data: ProductRequest, imagenes: File[]): Observable<ProductDTO> {
    const formulario = new FormData();
    formulario.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    for (const imagen of imagenes) {
      formulario.append('images', imagen, imagen.name);
    }

    // No se pone Content-Type: el navegador agrega el boundary del multipart
    return this.http.post<ProductDTO>(`${this.apiUrl}/seller/products`, formulario);
  }
}
