export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();

  console.log('Middleware hit:', url.hostname, pathname);

  const USERNAME = 'gukky';
  const PASSWORD = 'daaders';
  const VALID_BASIC = 'Basic ' + btoa(`${USERNAME}:${PASSWORD}`);

  const PUBLIC_PATHS = ['/audio/', '/media/', '/public/'];
  const PUBLIC_EXTENSIONS = ['.mp3', '.mp4', '.wav', '.ogg', '.m4a', '.epub', '.pdf'];

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isPublicFile = PUBLIC_EXTENSIONS.some(e => pathname.endsWith(e));

  if (!isPublicPath && !isPublicFile) {
    const auth = request.headers.get('Authorization');

    if (auth !== VALID_BASIC) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Protected Area"' }
      });
    }
  }

  return context.next();
}

