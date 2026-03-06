import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import Result from '../../../../infrastructure/result/result';
import { LandingGenerationLLMPort, LandingGenerationLLMRequest, LandingGenerationLLMResponse } from '../../application/ports/landing-generation-llm.port';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

@injectable()
export class LandingGenerationLLMAdapter implements LandingGenerationLLMPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async generateLanding(request: LandingGenerationLLMRequest): Promise<Result<LandingGenerationLLMResponse, Error>> {
    this._logger.info('landing-generation-llm.start', {
      promptLength: request.prompt.length
    });

    try {
      const response = await this._httpClient.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: request.prompt,
          model: 'llama3.1-8b'
        },
        {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      );

      const content = (response?.response ?? '').trim();

      if (!content) {
        return Result.failure(new Error('Empty response from AI service'));
      }

      this._logger.info('landing-generation-llm.response-received', {
        responseLength: content.length
      });

      // Парсим JSON ответ от LLM
      const parsedResponse = this.parseLLMResponse(content);

      this._logger.info('landing-generation-llm.success', {
        hasHtml: !!parsedResponse.html,
        hasCss: !!parsedResponse.css,
        hasJs: !!parsedResponse.js
      });

      return Result.success(parsedResponse);

    } catch (error) {
      this._logger.error('landing-generation-llm.error', {
        error: error instanceof Error ? error.message : String(error)
      });

      const message = error instanceof Error ? error.message : 'Unknown error';
      const isBlocked = message.includes('403') || message.includes('Cloudflare') || message.includes('<!DOCTYPE');

      if (isBlocked) {
        return Result.failure(new Error('AI proxy is unavailable (blocked or 403). Landing generation requires AI service access.'));
      }

      return Result.failure(new Error(`AI generation failed: ${message}`));
    }
  }

  private parseLLMResponse(content: string): LandingGenerationLLMResponse {
    // Очищаем от markdown formatting и лишнего текста
    let cleanContent = content.trim();
    cleanContent = cleanContent.replace(/```(?:json)?\s*\n?/g, '').replace(/```\s*\n?/g, '');

    const jsonStart = cleanContent.indexOf('{');
    if (jsonStart === -1) {
      throw new Error('No JSON object found in LLM response');
    }
    cleanContent = cleanContent.substring(jsonStart);

    // Извлекаем границы первого JSON-объекта с учётом строк (чтобы } внутри HTML/CSS/JS не обрывали разбор)
    const jsonEnd = this.findJsonObjectEnd(cleanContent);
    if (jsonEnd === -1) {
      throw new Error('Could not find end of JSON object (unbalanced braces or invalid string escaping)');
    }
    cleanContent = cleanContent.substring(0, jsonEnd + 1);

    this._logger.info('landing-generation-llm.cleaned-content', {
      originalLength: content.length,
      cleanedLength: cleanContent.length,
      startsWithBrace: cleanContent.startsWith('{'),
      endsWithBrace: cleanContent.endsWith('}'),
      cleanedPreview: cleanContent.substring(0, 300) + '...'
    });

    let parsed: any;
    try {
      parsed = JSON.parse(cleanContent);
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      this._logger.warn('landing-generation-llm.parse-error-try-extract', {
        error: msg,
        contentLength: cleanContent.length
      });
      const extracted = this.extractFieldsFromMalformedJson(cleanContent);
      if (extracted) {
        parsed = extracted;
      } else {
        this._logger.error('landing-generation-llm.parse-error', {
          error: msg,
          contentPreview: content.substring(0, 500) + '...'
        });
        throw new Error(`Invalid JSON from LLM: ${msg}`);
      }
    }

    if (!parsed.html || typeof parsed.html !== 'string') {
      throw new Error('Invalid response: missing or invalid HTML');
    }

    const response: LandingGenerationLLMResponse = {
      html: parsed.html.trim(),
      css: parsed.css && typeof parsed.css === 'string' ? parsed.css.trim() : undefined,
      js: parsed.js && typeof parsed.js === 'string' ? parsed.js.trim() : undefined,
      metadata: parsed.metadata && typeof parsed.metadata === 'object' ? parsed.metadata : undefined
    };

    const htmlLower = response.html.toLowerCase();
    if (!htmlLower.includes('<html') || !htmlLower.includes('<body')) {
      throw new Error('Generated HTML appears incomplete - missing required <html> or <body> tags');
    }

    return response;
  }

  /**
   * При невалидном JSON (например неэкранированные кавычки в HTML) извлекаем html, css, js по границам ключей.
   */
  private extractFieldsFromMalformedJson(jsonLike: string): { html: string; css?: string; js?: string; metadata?: object } | null {
    try {
      const htmlMatch = jsonLike.match(/"html"\s*:\s*"/);
      if (!htmlMatch || htmlMatch.index === undefined) return null;
      const htmlStart = htmlMatch.index + htmlMatch[0].length;

      const cssKeyPattern = /",\s*"css"\s*:\s*"/;
      const cssKeyMatch = jsonLike.substring(htmlStart).match(cssKeyPattern);
      if (!cssKeyMatch || cssKeyMatch.index === undefined) return null;
      const htmlEnd = htmlStart + cssKeyMatch.index;
      const htmlRaw = jsonLike.substring(htmlStart, htmlEnd);
      const html = this.unescapeJsonString(htmlRaw);
      if (!html || !html.toLowerCase().includes('<html') || !html.toLowerCase().includes('<body')) return null;

      const cssValueStart = htmlEnd + cssKeyMatch[0].length;
      const jsKeyPattern = /",\s*"js"\s*:\s*"/;
      const metaKeyPattern = /",\s*"metadata"\s*:\s*"/;
      const jsKeyMatch = jsonLike.substring(cssValueStart).match(jsKeyPattern);
      const metaAfterCssMatch = jsonLike.substring(cssValueStart).match(metaKeyPattern);
      let cssEnd: number;
      let css: string | undefined;
      let js: string | undefined;

      if (jsKeyMatch && jsKeyMatch.index !== undefined) {
        cssEnd = cssValueStart + jsKeyMatch.index;
        css = this.unescapeJsonString(jsonLike.substring(cssValueStart, cssEnd));
        const jsValueStart = cssEnd + jsKeyMatch[0].length;
        const metaAfterJsMatch = jsonLike.substring(jsValueStart).match(metaKeyPattern);
        if (metaAfterJsMatch && metaAfterJsMatch.index !== undefined) {
          js = this.unescapeJsonString(jsonLike.substring(jsValueStart, jsValueStart + metaAfterJsMatch.index));
        }
      } else if (metaAfterCssMatch && metaAfterCssMatch.index !== undefined) {
        cssEnd = cssValueStart + metaAfterCssMatch.index;
        css = this.unescapeJsonString(jsonLike.substring(cssValueStart, cssEnd));
      } else {
        return null;
      }

      return { html, css, js };
    } catch {
      return null;
    }
  }

  private unescapeJsonString(s: string): string {
    let out = '';
    let i = 0;
    while (i < s.length) {
      if (s[i] === '\\' && i + 1 < s.length) {
        const next = s[i + 1];
        if (next === '"') { out += '"'; i += 2; continue; }
        if (next === '\\') { out += '\\'; i += 2; continue; }
        if (next === 'n') { out += '\n'; i += 2; continue; }
        if (next === 'r') { out += '\r'; i += 2; continue; }
        if (next === 't') { out += '\t'; i += 2; continue; }
        if (next === 'u' && i + 5 <= s.length) {
          const hex = s.substring(i + 2, i + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            out += String.fromCharCode(parseInt(hex, 16));
            i += 6;
            continue;
          }
        }
      }
      out += s[i];
      i++;
    }
    return out;
  }

  /**
   * Находит индекс закрывающей скобки } верхнего объекта, не считая { } внутри строк.
   * Учитываются только двойные кавычки " (JSON), одинарные ' внутри значения просто пропускаются.
   */
  private findJsonObjectEnd(str: string): number {
    let depth = 0;
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      if (ch === '"') {
        i++;
        while (i < str.length) {
          if (str[i] === '\\') {
            i += 2;
            continue;
          }
          if (str[i] === '"') {
            i++;
            break;
          }
          i++;
        }
        continue;
      }
      if (ch === '{') {
        depth++;
        i++;
        continue;
      }
      if (ch === '}') {
        depth--;
        if (depth === 0) return i;
        i++;
        continue;
      }
      i++;
    }
    return -1;
  }
}