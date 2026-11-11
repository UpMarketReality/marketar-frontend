import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const esNuestraApi = req.url.startsWith(`${auth.apiUrl}/`);

  const esAutenticacion = req.url.startsWith(`${auth.apiUrl}/auth/`);

  // No adjuntar JWT al login, registro
  // ni a servicios externos.
  if (!esNuestraApi || esAutenticacion) {
    return next(req);
  }

  const token = auth.getToken();

  if (!token) {
    return next(req);
  }

  const requestConToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(requestConToken);
};
