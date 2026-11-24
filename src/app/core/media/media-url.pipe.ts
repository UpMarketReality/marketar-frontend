import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

// Origen del backend (http://localhost:8080), tomado de environment.apiUrl
const BACKEND_ORIGIN = new URL(environment.apiUrl).origin;

/**
 * Convierte la URL de una imagen guardada por el backend en una URL que el navegador pueda cargar.
 *
 * - Local:  "/media/products/x.png"            -> "http://localhost:8080/media/products/x.png"
 * - AWS S3: "https://bucket.s3.../products/x.png" -> se deja igual
 * - Vacía:  -> imagen de reemplazo (o el valor que se pase como argumento)
 *
 * Uso: <img [src]="product.mainImageUrl | mediaUrl" />
 */
export function resolveMediaUrl(
  url: string | null | undefined,
  fallback = 'assets/placeholder-mueble.svg',
): string {
  if (!url) return fallback;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return url.startsWith('/') ? `${BACKEND_ORIGIN}${url}` : url;
}

@Pipe({
  name: 'mediaUrl',
  standalone: true,
})
export class MediaUrlPipe implements PipeTransform {
  transform(url: string | null | undefined, fallback?: string): string {
    return resolveMediaUrl(url, fallback);
  }
}
