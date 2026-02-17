import { injectable, inject } from 'inversify';
import { HttpClientPort } from './ports/http-client.port';
import { API_CONFIG } from '../config/api.config';
import { sessionManager } from '../../shared/services/session-manager';
import { TYPES } from '../bootstrap/types';
import { TYPES as AUTH_TYPES } from '../../modules/auth/infrastructure/bootstrap/types';
import type { AuthServicePort } from '../../modules/auth/application/ports/auth-service.port';

@injectable()
export class HttpClient implements HttpClientPort {
  /** Always use absolute API URL to avoid requests going to frontend origin (404). */
  private readonly baseUrl = HttpClient.ensureAbsolute(API_CONFIG.BASE_URL);

  constructor(
    @inject(AUTH_TYPES.AuthService)
    private readonly _authService: AuthServicePort
  ) {}

  private static ensureAbsolute(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    const trimmed = (url || '').trim().replace(/^\//, '');
    return trimmed ? `https://${trimmed}` : url;
  }

  private buildUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  /**
   * Получить заголовки с x-user-id
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const userId = sessionManager.currentUserId;
    const headers: Record<string, string> = { ...customHeaders };
    if (userId) {
      headers['x-user-id'] = userId;
    }
    return headers;
  }

  private async requestWithAuthRetry<T = any>(
    method: string,
    url: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const requestHeaders = this.getHeaders(headers);
    let response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      credentials: 'include',
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
    });

    // If we get 401, try to refresh session and retry once
    if (response.status === 401) {
      console.log('🔄 Got 401, trying to refresh session...');
      try {
        const session = await this._authService.getSession();
        if (session) {
          console.log('✅ Session refreshed, retrying request...');
          // Retry the request with new session
          response = await fetch(fullUrl, {
            method,
            headers: requestHeaders,
            credentials: 'include',
            body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
          });
        }
      } catch (error) {
        console.warn('❌ Failed to refresh session:', error);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, return text or blob
      if (contentType?.includes('application/octet-stream')) {
        return await response.blob() as T;
      }
      const text = await response.text();
      return (text || undefined) as T;
    }

    const result = await response.json();
    return result;
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    console.log('🚀 HTTP GET Request:', { url: this.buildUrl(url), headers });
    const result = await this.requestWithAuthRetry('GET', url, undefined, headers);
    console.log('📥 HTTP GET Response:', result);
    return result;
  }

  async post<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    // Если данные - FormData, не устанавливаем Content-Type
    const isFormData = data instanceof FormData;
    const requestHeaders = isFormData
      ? headers
      : { 'Content-Type': 'application/json', ...headers };

    console.log('🚀 HTTP POST Request:', {
      url: this.buildUrl(url),
      headers: requestHeaders,
      bodySize: isFormData ? '[FormData]' : JSON.stringify(data).length
    });

    const result = await this.requestWithAuthRetry('POST', url, data, requestHeaders);
    console.log('📥 HTTP POST Response:', result);
    return result;
  }

  async put<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    const requestHeaders = { 'Content-Type': 'application/json', ...headers };

    console.log('🚀 HTTP PUT Request:', {
      url: this.buildUrl(url),
      headers: requestHeaders,
      bodySize: JSON.stringify(data).length
    });

    const result = await this.requestWithAuthRetry('PUT', url, data, requestHeaders);
    console.log('📥 HTTP PUT Response:', result);
    return result;
  }

  async getBlob(url: string, headers?: Record<string, string>): Promise<Blob> {
    console.log('🚀 HTTP GET Blob Request:', { url: this.buildUrl(url), headers });
    const result = await this.requestWithAuthRetry('GET', url, undefined, headers);
    console.log('📥 HTTP GET Blob Response: [Blob]');
    return result as Blob;
  }

  async patch<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    const requestHeaders = { 'Content-Type': 'application/json', ...headers };

    console.log('🚀 HTTP PATCH Request:', {
      url: this.buildUrl(url),
      headers: requestHeaders,
      bodySize: JSON.stringify(data).length
    });

    const result = await this.requestWithAuthRetry('PATCH', url, data, requestHeaders);
    console.log('📥 HTTP PATCH Response:', result);
    return result;
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    console.log('🚀 HTTP DELETE Request:', { url: this.buildUrl(url), headers });
    const result = await this.requestWithAuthRetry('DELETE', url, undefined, headers);
    console.log('📥 HTTP DELETE Response:', result);
    return result;
  }
}