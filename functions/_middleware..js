/**
 * Cloudflare Pages Middleware
 * Require HTTP Basic Auth for all visitors
 */

export async function onRequest(context) {
  const request = context.request;

  // Set your username and password
  const USERNAME = 'gukky';
  const PASSWORD = 'daaders';
  const VALID_BASIC = 'Basic ' + btoa(`${USERNAME}:${PASSWORD}`);

  // Get the Authorization header
  const authHeader = request.headers.get('Authorization');

  // If missing or incorrect, return 401
  if (authHeader !== VALID_BASIC) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Protected Area"'
      }
    });
  }

  // Auth is valid, continue to Pages content
  return context.next();
}

