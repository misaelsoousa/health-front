import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_BASE_URL } from '../api/api-base-url';

type QueryValue = string | number | boolean | readonly (string | number | boolean)[];

type HttpOptions = {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, QueryValue>;
  context?: HttpContext;
};

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get<T>(endpoint: string, options?: HttpOptions) {
    return this.http.get<T>(this.buildUrl(endpoint), options);
  }

  post<T, Body = unknown>(endpoint: string, body: Body, options?: HttpOptions) {
    return this.http.post<T>(this.buildUrl(endpoint), body, options);
  }

  put<T, Body = unknown>(endpoint: string, body: Body, options?: HttpOptions) {
    return this.http.put<T>(this.buildUrl(endpoint), body, options);
  }

  patch<T, Body = unknown>(endpoint: string, body: Body, options?: HttpOptions) {
    return this.http.patch<T>(this.buildUrl(endpoint), body, options);
  }

  delete<T>(endpoint: string, options?: HttpOptions) {
    return this.http.delete<T>(this.buildUrl(endpoint), options);
  }

  private buildUrl(endpoint: string) {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }

    return `${this.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  }
}
