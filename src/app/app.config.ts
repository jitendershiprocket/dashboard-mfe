import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { httpErrorInterceptor, authTokenInterceptor } from './interceptors/http-error.interceptor';

import { routes } from './app.routes';

/**
 * Angular 20 Application Configuration
 * 
 * Optimizations Applied:
 * - HTTP Interceptors for error handling and auth
 * - Zone coalescing for better performance
 * - Chart.js with default registerables
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authTokenInterceptor, httpErrorInterceptor])
    ),
    provideCharts(withDefaultRegisterables())
  ]
};
