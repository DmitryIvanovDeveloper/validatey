import { injectable } from 'inversify';
import { HttpClientPort } from './ports/http-client.port';
import { API_CONFIG } from '../config/api.config';
import { userContextService } from '../../shared/services/user-context.service';

@injectable()
export class HttpClient implements HttpClientPort {
  /** Always use absolute API URL to avoid requests going to frontend origin (404). */
  private readonly baseUrl = HttpClient.ensureAbsolute(API_CONFIG.BASE_URL);

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
    const userId = userContextService.getOrCreateUserId();
    return {
      'x-user-id': userId,
      ...customHeaders,
    };
  }

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const requestHeaders = this.getHeaders(headers);
    const response = await fetch(fullUrl, { method: 'GET', headers: requestHeaders });
    
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
      // If not JSON, return text or empty
      const text = await response.text();
      return (text || undefined) as T;
    }
    
    return response.json();
  }

  async getBlob(url: string, headers?: Record<string, string>): Promise<Blob> {
    const fullUrl = this.buildUrl(url);
    const requestHeaders = this.getHeaders(headers);
    const response = await fetch(fullUrl, { method: 'GET', headers: requestHeaders });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.blob();
  }

  async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const fullUrl = this.buildUrl(url);
    
    try {
      // Если данные - FormData, не устанавливаем Content-Type
      const isFormData = data instanceof FormData;
      const baseHeaders = this.getHeaders();
      const requestHeaders = isFormData 
        ? { ...baseHeaders, ...headers } 
        : { 'Content-Type': 'application/json', ...baseHeaders, ...headers };
      
      const body = isFormData ? data : JSON.stringify(data);
      
      console.log('🚀 HTTP POST Request:', {
        url: fullUrl,
        method: 'POST',
        headers: requestHeaders,
        body: isFormData ? '[FormData]' : body
      });
      console.log('📤 POST Request details:', JSON.stringify({
        url: fullUrl,
        headers: Object.keys(requestHeaders),
        bodySize: isFormData ? '[FormData]' : (body && typeof body === 'string' ? body.length : 0)
      }, null, 2));
      
      const response = await fetch(fullUrl, { 
        method: 'POST', 
        headers: requestHeaders,
        body
      });
      
      console.log('📥 HTTP POST Response:', {
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
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
        // If not JSON, return text or empty
        const text = await response.text();
        return (text || undefined) as T;
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('❌ HTTP Request failed:', error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...this.getHeaders(),
      ...headers,
    };
    
    const response = await fetch(fullUrl, { 
      method: 'PUT', 
      headers: requestHeaders,
      body: JSON.stringify(data)
    });
    
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
      // If not JSON, return text or empty
      const text = await response.text();
      return (text || undefined) as T;
    }
    
    return response.json();
  }

  async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...this.getHeaders(),
      ...headers,
    };
    const response = await fetch(fullUrl, {
      method: 'PATCH',
      headers: requestHeaders,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      return (text || undefined) as T;
    }
    return response.json();
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const fullUrl = this.buildUrl(url);
    const requestHeaders = this.getHeaders(headers);
    
    const response = await fetch(fullUrl, { 
      method: 'DELETE', 
      headers: requestHeaders 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    // DELETE может не возвращать тело
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return undefined as T;
  }
}
