import { injectable } from 'inversify';
import { HttpClientPort } from './ports/http-client.port';

@injectable()
export class HttpClient implements HttpClientPort {
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, { method: 'GET', headers });
    return response.json() as Promise<T>;
  }

  async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response.json() as Promise<T>;
  }

  async postFormData<T>(url: string, formData: FormData, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, { 
      method: 'POST', 
      headers: { ...headers }, // Не устанавливаем Content-Type для FormData
      body: formData
    });
    return response.json() as Promise<T>;
  }

  async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    return response.json() as Promise<T>;
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, { method: 'DELETE', headers });
    return response.json() as Promise<T>;
  }
}
