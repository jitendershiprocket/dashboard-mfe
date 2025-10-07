import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { ApiCacheService } from './api-cache.service';

/**
 * Optimized HTTP Service for Dashboard MFE
 * 
 * Only includes methods actually used in the dashboard:
 * - get() - General API calls
 * - getPinot() - Pinot database queries
 * - srDashboardGet() - Dashboard-specific API calls (PRIMARY)
 * 
 * All methods now support intelligent caching to reduce redundant API calls.
 * Cache automatically clears on page refresh.
 */
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private readonly pinotPath = window.location.host == 'app.shiprocket.in' 
    ? 'https://sr-report.shiprocket.in/'
    : 'https://sr-report-uat.shiprocket.in/';
  
  private readonly srDashboard = 'https://sr-dashboard-new.shiprocket.in/api/';
  
  private token = localStorage.getItem('satellizer_token');

  constructor(
    private http: HttpClient,
    private cacheService: ApiCacheService
  ) {
    if (this.auth_token == null) {
      this.token = '';
    } else {
      this.token = this.auth_token;
    }
  }

  private get auth_token(): string | null {
    return this.token;
  }

  /**
   * Get authorization headers with token
   */
  private getHeaders(): HttpHeaders {
    this.token = localStorage.getItem('satellizer_token');
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + this.token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'No-Auth': 'True',
      Cookiie: localStorage.getItem('cookiie') ?? ''
    });
    return headers;
  }

  /**
   * Build URL with environment API path
   */
  private _getURL(url: string): string {
    return `${environment.apiPath}${url}`;
  }

  /**
   * Convert object to HTTP query parameters
   */
  private getQueryParam(obj: any): HttpParams {
    let search = new HttpParams();
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        search = search.set(key, obj[key]);
      }
    }
    return search;
  }

  /**
   * Standard GET request with caching
   * Used in: overview.ts, whatsapp.ts
   * 
   * Cache TTL: 5 minutes (default)
   * Cache key: URL + params
   */
  get(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json',
    useCache: boolean = true
  ): Observable<any> {
    const fullUrl = this._getURL(apiURL);
    
    // If caching is disabled, make direct API call
    if (!useCache) {
      const paramsData = this.getQueryParam(params);
      return this.http.get(fullUrl, {
        params: paramsData,
        headers: this.getHeaders(),
        withCredentials: true,
        responseType: responseType,
      });
    }
    
    // Use cacheable request
    return this.cacheService.cacheableRequest(
      fullUrl,
      params,
      () => {
        const paramsData = this.getQueryParam(params);
        return this.http.get(fullUrl, {
          params: paramsData,
          headers: this.getHeaders(),
          withCredentials: true,
          responseType: responseType,
        });
      }
    );
  }

  /**
   * Pinot database GET request with caching
   * Used in: overview.ts, orders.ts, rto.ts
   * 
   * Cache TTL: 5 minutes (default)
   * Cache key: URL + params
   */
  getPinot(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json',
    useCache: boolean = true
  ): Observable<any> {
    const fullUrl = this.pinotPath + apiURL;
    
    // If caching is disabled, make direct API call
    if (!useCache) {
      const paramsData = this.getQueryParam(params);
      return this.http.get(fullUrl, {
        params: paramsData,
        headers: this.getHeaders(),
        responseType: responseType,
      });
    }
    
    // Use cacheable request
    return this.cacheService.cacheableRequest(
      fullUrl,
      params,
      () => {
        const paramsData = this.getQueryParam(params);
        return this.http.get(fullUrl, {
          params: paramsData,
          headers: this.getHeaders(),
          responseType: responseType,
        });
      }
    );
  }

  /**
   * Dashboard-specific GET request with caching (PRIMARY METHOD)
   * Used in: overview.ts, orders.ts, shipments.ts, ndr.ts, rto.ts, courier.ts, delays.ts
   * 
   * Cache TTL: 5 minutes (default)
   * Cache key: URL + params
   */
  srDashboardGet(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json',
    useCache: boolean = true
  ): Observable<any> {
    const fullUrl = this.srDashboard + apiURL;
    
    // If caching is disabled, make direct API call
    if (!useCache) {
      const paramsData = this.getQueryParam(params);
      return this.http.get(fullUrl, {
        params: paramsData,
        headers: this.getHeaders(),
        responseType: responseType,
      });
    }
    
    // Use cacheable request
    return this.cacheService.cacheableRequest(
      fullUrl,
      params,
      () => {
        const paramsData = this.getQueryParam(params);
        return this.http.get(fullUrl, {
          params: paramsData,
          headers: this.getHeaders(),
          responseType: responseType,
        });
      }
    );
  }

  /**
   * Clear all cached API responses
   * Useful when user manually refreshes data or changes global filters
   */
  clearCache(): void {
    this.cacheService.clear();
  }

  /**
   * Clear specific cached API response
   * @param apiURL API endpoint URL
   * @param params Request parameters
   */
  clearSpecificCache(apiURL: string, params: unknown = {}): void {
    this.cacheService.clear(apiURL, params);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }
}
