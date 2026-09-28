import { NextFunction, Request, Response } from 'express';

const PROXYABLE_HEADERS = [
  'authorization',
  'cookie',
  'x-user-id',
  'x-guest-slug',
  'content-type',
] as const;

function getInsightsBaseUrl(): string | null {
  const raw = process.env.INSIGHTS_SERVICE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

function buildTargetUrl(req: Request, segment: string): string | null {
  const base = getInsightsBaseUrl();
  if (!base) return null;
  const projectId = req.params.projectId;
  if (!projectId) return null;
  // req.url includes remaining path and query for this mounted route.
  // Example: /canvas?foo=bar
  const suffix = req.url.startsWith('/') ? req.url : `/${req.url}`;
  return `${base}/internal/insights/projects/${encodeURIComponent(projectId)}/${segment}${suffix}`;
}

function buildFlatTargetUrl(req: Request, targetPrefix: string): string | null {
  const base = getInsightsBaseUrl();
  if (!base) return null;
  const suffix = req.url.startsWith('/') ? req.url : `/${req.url}`;
  const cleanPrefix = targetPrefix.startsWith('/') ? targetPrefix : `/${targetPrefix}`;
  return `${base}${cleanPrefix}${suffix}`;
}

function pickForwardHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const name of PROXYABLE_HEADERS) {
    const value = req.header(name);
    if (value) headers[name] = value;
  }

  const serviceToken = process.env.INSIGHTS_SERVICE_TOKEN?.trim();
  if (serviceToken) {
    headers['x-service-token'] = serviceToken;
  }

  return headers;
}

export function maybeProxyToInsights(segment: 'research' | 'comments' | 'scraper' | 'early-signals') {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Used by insights-service bridge calls to prevent proxy loops.
    if (req.header('x-bypass-insights-proxy') === '1') {
      return next();
    }

    const targetUrl = buildTargetUrl(req, segment);
    if (!targetUrl) {
      return next();
    }

    try {
      const method = req.method.toUpperCase();
      const headers = pickForwardHeaders(req);
      const canHaveBody = !['GET', 'HEAD'].includes(method);
      const body =
        canHaveBody && req.body !== undefined && Object.keys(req.body || {}).length > 0
          ? JSON.stringify(req.body)
          : undefined;

      const response = await fetch(targetUrl, {
        method,
        headers,
        body,
      });

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }

      const text = await response.text();
      res.status(response.status).send(text);
      return;
    } catch (error) {
      return res.status(502).json({
        error: 'Failed to proxy to insights-service',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

export function maybeProxyToInsightsFlat(targetPrefix: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.header('x-bypass-insights-proxy') === '1') {
      return next();
    }

    const targetUrl = buildFlatTargetUrl(req, targetPrefix);
    if (!targetUrl) {
      return next();
    }

    try {
      const method = req.method.toUpperCase();
      const headers = pickForwardHeaders(req);
      const canHaveBody = !['GET', 'HEAD'].includes(method);
      const body =
        canHaveBody && req.body !== undefined && Object.keys(req.body || {}).length > 0
          ? JSON.stringify(req.body)
          : undefined;

      const response = await fetch(targetUrl, {
        method,
        headers,
        body,
      });

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }

      const text = await response.text();
      res.status(response.status).send(text);
      return;
    } catch (error) {
      return res.status(502).json({
        error: 'Failed to proxy to insights-service',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

