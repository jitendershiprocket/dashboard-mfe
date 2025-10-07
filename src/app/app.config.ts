import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts } from 'ng2-charts';
import { httpErrorInterceptor, authTokenInterceptor } from './interceptors/http-error.interceptor';
import { ArcElement, Tooltip, Legend, DoughnutController, PieController } from 'chart.js';
import { Chart } from 'chart.js';

import { routes } from './app.routes';

// Register only the Chart.js components we actually use (reduces bundle size)
Chart.register(ArcElement, Tooltip, Legend, DoughnutController, PieController);

/**
 * Angular 20 Application Configuration - Optimized for Custom Elements
 * 
 * Build Optimizations Applied:
 * - HTTP Interceptors for error handling and auth
 * - Zone coalescing + ignoreChangesOutsideZone for better performance
 * - Selective Chart.js registration (only doughnut/pie - saves ~100KB+)
 * - Tree-shakeable providers
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ 
      eventCoalescing: true,
      runCoalescing: true,
      ignoreChangesOutsideZone: true 
    }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authTokenInterceptor, httpErrorInterceptor])
    ),
    provideCharts()
  ]
};
