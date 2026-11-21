import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Pantalla de login de la ruta (por defecto la del comprador)
  const loginUrl = (route.data['loginUrl'] as string | undefined) ?? '/inicio-sesion';

  // Usuario sin sesión: redirigir al login correspondiente
  if (!auth.isAuthenticated()) {
    return router.createUrlTree([loginUrl], {
      queryParams: { returnUrl: state.url },
    });
  }

  // Comprobar el rol requerido por la ruta
  const role = route.data['role'] as string | undefined;

  if (role && !auth.hasRole(role)) {
    return router.createUrlTree(['/home1']);
  }

  return true;
};
