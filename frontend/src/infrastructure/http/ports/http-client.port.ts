export interface HttpClientPort {
  get<T>(url: string, headers?: Record<string, string>): Promise<T>;
  getBlob(url: string, headers?: Record<string, string>): Promise<Blob>;
  post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T>;
  put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T>;
  patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T>;
  delete<T>(url: string, headers?: Record<string, string>): Promise<T>;
}
