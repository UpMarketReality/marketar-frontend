import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth-interceptor';
import { provideAppIcons } from './core/icons/app-icons';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { PaginatorIntlEs } from './core/material/paginator-intl-es';

export let appConfig: ApplicationConfig;
appConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppIcons(),
    { provide: MatPaginatorIntl, useClass: PaginatorIntlEs },
  ],
};
