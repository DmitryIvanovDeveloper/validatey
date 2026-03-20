import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LandingGenerationLLMAdapter } from './landing-generation-llm.adapter';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

const mockLogger: LoggerPort = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const minimalValidHtml =
  '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Test</title></head><body><h1>Hello</h1></body></html>';

const validLandingJson = () =>
  JSON.stringify({
    html: minimalValidHtml,
    css: 'body { margin: 0; }',
    js: '// optional',
    metadata: { mobileOptimized: true },
  });

describe('LandingGenerationLLMAdapter', () => {
  let httpClient: HttpClientPort;
  let adapter: LandingGenerationLLMAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      postFormData: vi.fn(),
    };
    adapter = new LandingGenerationLLMAdapter(mockLogger, httpClient);
  });

  it('returns valid landing when API returns valid JSON with html/css/js', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: validLandingJson(),
    });
    const result = await adapter.generateLanding({ prompt: 'Generate a landing' });
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.data.html).toContain('<html');
      expect(result.data.html).toContain('<body');
      expect(result.data.html).toContain('Hello');
      expect(result.data.css).toBe('body { margin: 0; }');
      expect(result.data.js).toBe('// optional');
      expect(result.data.metadata?.mobileOptimized).toBe(true);
    }
  });

  it('accepts response with markdown code block and strips it', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: '```json\n' + validLandingJson() + '\n```',
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.data.html).toContain('<html');
      expect(result.data.html).toContain('<body');
    }
  });

  it('extracts JSON correctly when html contains curly braces (CSS/JS)', async () => {
    const htmlWithBraces =
      '<!DOCTYPE html><html><head><style>a { color: red; }</style></head><body><script>const o = {};</script></body></html>';
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: JSON.stringify({
        html: htmlWithBraces,
        css: '.btn { display: block; }',
        js: 'function f() { return {}; }',
      }),
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.data.html).toContain('a { color: red; }');
      expect(result.data.html).toContain('<body');
      expect(result.data.css).toContain('.btn { display: block; }');
      expect(result.data.js).toContain('function f() { return {}; }');
    }
  });

  it('accepts HTML with uppercase tags (case-insensitive check)', async () => {
    const htmlUpper =
      '<!DOCTYPE html><HTML lang="en"><HEAD></HEAD><BODY><p>Hi</p></BODY></HTML>';
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: JSON.stringify({ html: htmlUpper }),
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.data.html).toContain('Hi');
    }
  });

  it('fails when response is empty', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.message).toContain('Empty response');
    }
  });

  it('fails when response has no JSON object', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: 'Here is my explanation instead of JSON.',
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.message).toMatch(/No JSON object|AI generation failed/);
    }
  });

  it('fails when JSON has no html field', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: JSON.stringify({ css: 'x', js: 'y' }),
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.message).toMatch(/missing or invalid HTML|AI generation failed/);
    }
  });

  it('fails when html is missing required tags', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: JSON.stringify({
        html: '<div>Just a div</div>',
        css: '',
        js: '',
      }),
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.message).toMatch(/incomplete|missing required|AI generation failed/);
    }
  });

  it('fails when JSON is invalid (unclosed string)', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: '{"html": "<html><body>oops',
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(false);
  });

  it('accepts response with text before JSON object', async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: 'Sure, here is the landing page:\n' + validLandingJson(),
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.data.html).toContain('<html');
    }
  });

  it('recovers from invalid JSON (unescaped quote in HTML) via key-boundary extraction', async () => {
    // LLM output with unescaped " in HTML (e.g. class="hero") — JSON.parse fails; we extract by ", "css": " boundary
    const dq = '"';
    const brokenJson =
      `{"html": "<!DOCTYPE html><html lang='en'><head><title>Test</title></head><body><div class=${dq}hero${dq}>Hi</div></body></html>", "css": "body {}", "js": ""}`;
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: brokenJson,
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.data.html).toContain('<html');
      expect(result.data.html).toContain('<body');
      expect(result.data.html).toContain('Hi');
      expect(result.data.css).toContain('body {}');
    }
  });

  it('recovers when JSON boundary cannot be found but field keys exist', async () => {
    // Missing closing quote for js causes scanner to fail finding object end.
    // Adapter should still recover html/css via key-boundary extraction.
    const malformed =
      '{"html":"<!DOCTYPE html><html><body><h1>Hi</h1></body></html>","css":"body{margin:0;}","js":"console.log(1)';
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      response: malformed,
    });
    const result = await adapter.generateLanding({ prompt: 'Generate' });
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.data.html).toContain('<html');
      expect(result.data.html).toContain('<body');
      expect(result.data.css).toContain('margin:0');
    }
  });
});
