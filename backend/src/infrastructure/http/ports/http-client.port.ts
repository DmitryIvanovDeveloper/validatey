export interface HttpClientPort {
  get<T>(url: string, headers?: Record<string, string>): Promise<T>;
  post<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T>;
  postFormData<T>(url: string, formData: FormData, headers?: Record<string, string>): Promise<T>;
  put<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T>;
  delete<T>(url: string, headers?: Record<string, string>): Promise<T>;
}
