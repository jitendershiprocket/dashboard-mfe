import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private baseUrl =
    window.location.host == 'app.shiprocket.in'
      ? 'https://sr-go.shiprocket.in/'
      : 'https://sr-go-channels-partnerships-qa.kartrocket.com/';

  private token = localStorage.getItem('satellizer_token');
  public apiBaseUrl = environment.apiPath;
  public srChannelPAth =
    window.location.host == 'app.shiprocket.in'
      ? 'https://sr-channel.shiprocket.in/v1/'
      : 'https://sr-channel-qa-1.kartrocket.com/v1/';
  public srDashboard = 'https://sr-dashboard-new.shiprocket.in/api/';
  public device_id = localStorage.getItem('device_id');
  public auth_token = this.token;
  public domain = '.shiprocket.in';
  public multichannelApiUrl = environment.apiPath;
  public enableReturnInsurance = false;
  public serviceabilityPath =  environment.serviceabilityPath;
  public pinotPath = window.location.host == 'app.shiprocket.in' ? "https://sr-report.shiprocket.in/":"https://sr-report-uat.shiprocket.in/";
  public googleMapsAPIKey = 'AIzaSyDRKtDYplrerqy7O-IJ5mCnDg4ryciNtVo';
  


  constructor(
    private http: HttpClient,
    private _ActivatedRoute: ActivatedRoute,
    private router: Router
  ) {
    if (this.auth_token == null) {
      this.token = '';
    } else {
      this.token = this.auth_token;
    }
  }


  getHeaders(): HttpHeaders {
    this.token = localStorage.getItem('satellizer_token');
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + this.token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'No-Auth': 'True',
      Cookiie : localStorage.getItem('cookiie') ?? ""
    });
    return headers;
  }
  /**
   *
   * @param apiURL
   * @param data Body for post
   * @param params Request Params
   */

  postCallWithAssignment(apiURL: string, body: any, params: unknown = {}): Observable<any> {
    const paramsData = this.getQueryParam(params);
    if(body.package_count) body.package_count = Number(body.package_count)
    return this.http.post(environment?.assignmentBaseUrl + apiURL,body,
      {
        params: paramsData,
        headers: this.getHeaders(),
        withCredentials: true,
      }
    );
  }

  post(apiURL: string, body: any, params: unknown = {}): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.post(this._getURL(apiURL), body, {
      params: paramsData,
      headers: this.getHeaders(),
      withCredentials: true,
    });
  }

  postToUrl(url: string, body: any, params: unknown = {}): Observable<any> {
    const queryParams = this.getQueryParam(params);
    return this.http.post(url, body, {
      params: queryParams,
      headers: this.getHeaders(),
      withCredentials: true,
    });
  }

  getToUrl(
    url: string,
    params: unknown = {},
    responseType: any = 'json'
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.get(url, {
      params: paramsData,
      headers: this.getHeaders(),
      responseType: responseType,
    });
  }

  // use only special api call
  post_sr_core_awb(
    apiURL: string,
    body: any,
    params: unknown = {}
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.post(apiURL, body, {
      params: paramsData,
      headers: this.getHeaders(),
      withCredentials: true,
    });
  }

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
  getBulkSampleData(url:any):Observable<any>{
    return this.http.get(url,{
      headers: this.getHeaders(),
      withCredentials: false,
      responseType: 'json',
    });
  }
  getData(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json'
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.get(this.baseUrl + apiURL, {
      params: paramsData,
      headers: this.getHeaders(),
      // withCredentials: true,
      responseType: responseType,
    });
  }
  // on ship now button click 
  getServiceability(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json'
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.get(this.serviceabilityPath + apiURL, {
      params: paramsData,
      headers: this.getHeaders(),
      withCredentials: true, // use 'false' in case of localhost
      responseType: responseType,
    });
  }
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

  ondcGet(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json'
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.get(this.srChannelPAth + apiURL, {
      params: paramsData,
      headers: this.getHeaders(),
      responseType: responseType,
    });
  }

  ondcPut(apiURL: string, body: any): Observable<any> {
    return this.http.put(this.srChannelPAth + apiURL, body, {
      headers: this.getHeaders(),
    });
  }

  ondcPost(apiURL: string, body: any): Observable<any> {
    return this.http.post(this.srChannelPAth + apiURL, body, {
      headers: this.getHeaders(),
    });
  }
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

  put(apiURL: string, body: any, params?: string): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.put(this._getURL(apiURL), body, {
      params: paramsData,
      headers: this.getHeaders(),
      withCredentials: true,
    });
  }

  buyertrackingPutCall(
    apiURL: string,
    body: any,
    params?: string
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.put(this._getURL(apiURL), body, {
      params: paramsData,
      headers: this.getHeaders(),
      withCredentials: true,
    });
  }

  patch(apiURL: string, body: any, params?: string): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.patch(this._getURL(apiURL), body, {
      params: paramsData,
      headers: this.getHeaders(),
      withCredentials: true,
    });
  }
  delete(apiURL: string): Observable<any> {
    return this.http.delete(this._getURL(apiURL), {
      headers: this.getHeaders(),
      withCredentials: true,
    });
  }

  /**
   * @description Simple post request,except headers are not passing content-type.
   * @param apiURL endpoint of the request
   * @param data Body for post
   */
  formPost(apiURL: string, body: FormData): Observable<any> {
    const token = this.token;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Cookiie: localStorage.getItem('cookiie') ?? ""
    });

    return this.http.post(this._getURL(apiURL), body, { headers });
  }

  ondcFormPost(apiURL: string, body: FormData): Observable<any> {
    const token = this.token;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Cookiie: localStorage.getItem('cookiie') ?? ""
    });

    return this.http.post(this.srChannelPAth + apiURL, body, { headers });
  }

  public _getURL(url: string): string {
    return `${environment.apiPath}${url}`;
  }

  public _getDashboardURL(url: string): string {
    return `https://sr-dashboard-new.shiprocket.in/api/${url}`;
  }

  getQueryParam(obj: any): HttpParams {
    let search = new HttpParams();
    for (const key in obj) {
      search = search.set(key, obj[key]);
    }
    return search;
  }

  logout(): Observable<any> {
    const body = {
      is_web: 1,
    };
    const apiURL = 'auth/logout';

    return this.http.post(this._getURL(apiURL), body, {
      headers: this.getHeaders(),
    });
  }

  getForDashboard(
    apiURL: string,
    params: unknown = {},
    responseType: any = 'json'
  ): Observable<any> {
    const paramsData = this.getQueryParam(params);
    return this.http.get(this._getDashboardURL(apiURL), {
      params: paramsData,
      headers: this.getHeaders(),
      withCredentials: true,
      responseType: responseType,
    });
  }
  getOrderCustomerDetails(orderId: string): Observable<any> {
    return this.get(`orders/cust-details/${orderId}`);
  }
  getReturnCustomerDetails(orderId: string): Observable<any> {
    const type='return';
    return this.get(`orders/cust-details/${orderId}?type=return`);
  }
}
