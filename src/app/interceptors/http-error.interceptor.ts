import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, timer, throwError } from 'rxjs';

/**
 * Modern Angular 20 HTTP Interceptor with:
 * - Automatic retry logic with exponential backoff
 * - Centralized error handling
 * - Smart retry strategy (skip client errors)
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    // Retry failed requests with exponential backoff
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Don't retry on client errors (400-499)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s (max 5s)
        const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        console.log(`HTTP Retry attempt ${retryCount} after ${delayMs}ms`);
        return timer(delayMs);
      }
    }),
    
    // Handle errors after retries exhausted
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);
      
      // Handle specific error codes with console logging
      switch (error.status) {
        case 401:
          // Unauthorized - redirect to login
          console.warn('Unauthorized access - token may be expired');
          console.error('Session expired. Please login again.');
          // Optional: Redirect to login page
          // window.location.href = '/login';
          break;
          
        case 403:
          // Forbidden
          console.error('Access denied. You do not have permission to access this resource.');
          break;
          
        case 404:
          // Not found
          console.error('Resource not found.');
          break;
          
        case 0:
          // Network error (no internet connection)
          console.error('Network error. Please check your internet connection.');
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          console.error('Server error. Please try again later.');
          break;
          
        default:
          // Generic error
          console.error(error.error?.message || 'An unexpected error occurred.');
      }
      
      // Propagate error to component
      return throwError(() => error);
    })
  );
};

/**
 * Loading interceptor to show global loading indicator
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // You can inject a loading service here if needed
  // const loadingService = inject(LoadingService);
  // loadingService.show();
  
  return next(req).pipe(
    // Hide loading indicator when request completes
    // finalize(() => loadingService.hide())
  );
};

/**
 * Auth token interceptor to add Authorization header
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('satellizer_token');
  const cookiie = localStorage.getItem('cookiie');
  
  if (token) {
    // Clone the request and add Authorization header
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        ...(cookiie && { Cookiie: cookiie })
      }
    });
    return next(authReq);
  }
  
  return next(req);
};

