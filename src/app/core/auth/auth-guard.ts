import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Usuario sin sesión: redirigir al login.
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/inicio-sesion'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // Comprobar el rol requerido por la ruta.
  const role = route.data['role'] as string | undefined;

  if (role && !auth.hasRole(role)) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
