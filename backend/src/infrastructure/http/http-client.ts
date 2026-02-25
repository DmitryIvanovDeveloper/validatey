import { injectable } from 'inversify';
import { HttpClientPort } from './ports/http-client.port';

/** Default timeout for external API calls (Reddit, Serper, Google Autocomplete) */
const DEFAULT_TIMEOUT_MS = 25_000;

/** Extended timeout for LLM inference endpoints which are intentionally slow */
const LLM_TIMEOUT_MS = 120_000;

const LLM_URL_PATTERNS = ['cerebras', 'openai', 'anthropic', 'groq', 'llm', 'ai/prompt', 'api/prompt'];

function resolveTimeout(url: string): number {
  const lower = url.toLowerCase();
  return LLM_URL_PATTERNS.some((p) => lower.includes(p)) ? LLM_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

@injectable()
export class HttpClient implements HttpClientPort {
  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(resolveTimeout(url)),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json() as Promise<T>;
  }

  async post<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(resolveTimeout(url)),
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
      headers: { ...headers },
      body: formData,
      signal: AbortSignal.timeout(resolveTimeout(url)),
    });
    return response.json() as Promise<T>;
  }

  async put<T>(url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(resolveTimeout(url)),
    });
    return response.json() as Promise<T>;
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(resolveTimeout(url)),
    });
    return response.json() as Promise<T>;
  }
}
