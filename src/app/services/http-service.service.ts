import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

/**
 * Optimized HTTP Service for Dashboard MFE
 * 
 * Only includes methods actually used in the dashboard:
 * - get() - General API calls
 * - getPinot() - Pinot database queries
 * - srDashboardGet() - Dashboard-specific API calls (PRIMARY)
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

  constructor(private http: HttpClient) {
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
   * Standard GET request
   * Used in: overview.ts, whatsapp.ts
   */
  get(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json'
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.get(this._getURL(apiURL), {
      params: paramsData,
      headers: this.getHeaders(),
      withCredentials: true,
      responseType: responseType,
    });
  }

  /**
   * Pinot database GET request
   * Used in: overview.ts, orders.ts, rto.ts
   */
  getPinot(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json'
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.get(this.pinotPath + apiURL, {
      params: paramsData,
      headers: this.getHeaders(),
      responseType: responseType,
    });
  }

  /**
   * Dashboard-specific GET request (PRIMARY METHOD)
   * Used in: overview.ts, orders.ts, shipments.ts, ndr.ts, rto.ts, courier.ts, delays.ts
   */
  srDashboardGet(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json'
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.get(this.srDashboard + apiURL, {
      params: paramsData,
      headers: this.getHeaders(),
      responseType: responseType,
    });
  }
}
