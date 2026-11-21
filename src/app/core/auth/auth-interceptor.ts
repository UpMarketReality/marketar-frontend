import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiUrl = environment.apiUrl.replace(/\/+$/, '');

  const esNuestraApi = req.url.startsWith(`${apiUrl}/`);

  // Rutas públicas reales de Spring Boot
  const esAutenticacion =
    req.url === `${apiUrl}/v1/auth/login` || req.url === `${apiUrl}/v1/auth/register`;

  if (!esNuestraApi || esAutenticacion) {
    return next(req);
  }

  const token = auth.getToken();

  // Depuración temporal, sin exponer el JWT
  console.log('URL:', req.url);
  console.log('¿API reconocida?', esNuestraApi);
  console.log('¿Token disponible?', !!token);

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
