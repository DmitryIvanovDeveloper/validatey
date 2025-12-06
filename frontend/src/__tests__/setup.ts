import 'reflect-metadata';
import { vi } from 'vitest';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Mock Blob constructor for tests
global.Blob = class MockBlob {
  constructor(public chunks: any[], public options: any) {}
  get size() {
    return this.chunks.reduce((total, chunk) => total + chunk.length, 0);
  }
  get type() {
    return this.options?.type || '';
  }
} as any;

// Mock FormData for tests
global.FormData = class MockFormData {
  private data = new Map<string, any>();
  
  append(key: string, value: any, filename?: string) {
    this.data.set(key, { value, filename });
  }
  
  get(key: string) {
    return this.data.get(key)?.value;
  }
  
  has(key: string) {
    return this.data.has(key);
  }
  
  delete(key: string) {
    this.data.delete(key);
  }
  
  entries() {
    return this.data.entries();
  }
  
  keys() {
    return this.data.keys();
  }
  
  values() {
    return Array.from(this.data.values()).map(item => item.value);
  }
} as any;

// Mock fetch for HTTP client tests
global.fetch = vi.fn();

// Mock URL for tests
global.URL = class MockURL {
  constructor(public href: string) {}
  toString() {
    return this.href;
  }
} as any;


