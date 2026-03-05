/**
 * Vercel Edge Middleware: proxy landing subdomains (*.validatey.com) to the backend
 * so that https://project-23071e04.validatey.com is served by the backend landing routes.
 *
 * Set BACKEND_ORIGIN in Vercel (e.g. https://api.validatey.com) to your backend URL.
 */
import { next } from '@vercel/functions';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};

export default async function middleware(request) {
  const host = request.headers.get('host') || '';
  const url = new URL(request.url);

  // Landing subdomain: project-xxx.validatey.com (not www, not apex)
  const isLandingSubdomain =
    host.endsWith('.validatey.com') &&
    host !== 'validatey.com' &&
    host !== 'www.validatey.com' &&
    host.split('.')[0]?.startsWith('project-');

  if (!isLandingSubdomain) {
    return next();
  }

  const backendOrigin = process.env.BACKEND_ORIGIN || process.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || '';
  if (!backendOrigin) {
    return new Response('Backend not configured (set BACKEND_ORIGIN)', { status: 502 });
  }

  const backendUrl = new URL(url.pathname + url.search, backendOrigin);
  const headers = new Headers(request.headers);
  headers.set('Host', host);
  headers.delete('connection');

  try {
    const res = await fetch(backendUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      duplex: 'half',
    });
    const resHeaders = new Headers(res.headers);
    resHeaders.set('Access-Control-Allow-Origin', request.headers.get('origin') || `https://${host}`);
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (e) {
    return new Response('Proxy error: ' + (e.message || 'unknown'), { status: 502 });
  }
}
