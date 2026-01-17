export async function onRequest() {
  return new Response('MIDDLEWARE ACTIVE', { status: 418 });
}

/**
 * Cloudflare Pages Middleware
 * Basic Auth + proxy behavior
 */

/* --------------------------------------------------------------
 * BASIC AUTH
 * -------------------------------------------------------------- */
const USERNAME = context.env.AUTH_USER;
const PASSWORD = context.env.AUTH_PASS;
const VALID_BASIC = 'Basic ' + btoa(`${USERNAME}:${PASSWORD}`);

/* --------------------------------------------------------------
 * PUBLIC PATHS / EXTENSIONS
 * -------------------------------------------------------------- */
const PUBLIC_PATHS = [
  '/audio/',
  '/media/',
  '/public/'
];

const PUBLIC_EXTENSIONS = [
  '.mp3', '.mp4', '.wav', '.ogg', '.m4a', '.epub', '.pdf'
];

/* --------------------------------------------------------------
 * Pages entry point
 * -------------------------------------------------------------- */
export async function onRequest(context) {
  return handleRequest(context.request);
}

/* --------------------------------------------------------------
 * Main request handler
 * -------------------------------------------------------------- */
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();

  // ---- Bypass middleware entirely for audio subdomain ----------
  if (url.hostname === 'audio.heuring.us') {
    return fetch(request);
  }

  // ---- Public paths / files -----------------------------------
  const isPublicPath = PUBLIC_PATHS.some(path =>
    pathname.startsWith(path)
  );

  const isPublicFile = PUBLIC_EXTENSIONS.some(ext =>
    pathname.endsWith(ext)
  );

  if (isPublicPath || isPublicFile) {
    return fetch(request);
  }

  // ---- Auth check ---------------------------------------------
  const authHeader = request.headers.get('Authorization');

  if (authHeader !== VALID_BASIC) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected Area"'
      }
    });
  }

  // ---- Auth passed --------------------------------------------
  return fetch(request);
}
