/**
 * Cloudflare Pages Middleware
 * First-time login only; remember via cookie; public assets bypassed
 * Fully compatible with Pages Functions API
 */

export async function onRequest({ request, env, params, next }) {
  const COOKIE_NAME = 'pages-auth';
  const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

  // Use environment variables in production
  const USERNAME = env.AUTH_USER || 'gukky';
  const PASSWORD = env.AUTH_PASS || 'daaders';
  const VALID_BASIC = 'Basic ' + btoa(`${USERNAME}:${PASSWORD}`);

  const url = new URL(request.url);
  const cookies = parseCookies(request.headers.get('Cookie') || '');

  // --- Bypass public assets ---
  const PUBLIC_EXTENSIONS = [
    '.pdf', '.mp3', '.mp4', '.wav', '.ogg', '.m4a',
    '.epub', '.jpg', '.jpeg', '.png', '.gif', '.webp'
  ];
  if (PUBLIC_EXTENSIONS.some(ext => url.pathname.toLowerCase().endsWith(ext))) {
    return next();
  }

  // --- Logout endpoint ---
  if (url.pathname === '/logout') {
    return new Response('Logged out', {
      status: 200,
      headers: {
        'Set-Cookie': `${COOKIE_NAME}=deleted; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
        'Content-Type': 'text/plain'
      }
    });
  }

  // --- Already logged in via cookie? ---
  if (cookies[COOKIE_NAME] === VALID_BASIC) {
    return next();
  }

  // --- Browser Basic Auth header valid? ---
  const authHeader = request.headers.get('Authorization');
  if (authHeader === VALID_BASIC) {
    const response = await next();
    response.headers.append(
      'Set-Cookie',
      `${COOKIE_NAME}=${VALID_BASIC}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax`
    );
    return response;
  }

  // --- Form login submission ---
  const user = url.searchParams.get('user') || '';
  const pass = url.searchParams.get('pass') || '';
  if (btoa(`${user}:${pass}`) === btoa(`${USERNAME}:${PASSWORD}`)) {
    const response = await next();
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        'Set-Cookie': `${COOKIE_NAME}=${VALID_BASIC}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax`
      }
    });
  }

  // --- Otherwise show login page ---
  const loginPage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Login Required</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; margin: 0; }
        .login-box { background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
        input { width: 100%; padding: 0.5rem; margin: 0.5rem 0; font-size: 1rem; }
        button { padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="login-box">
        <h1>Protected Area</h1>
        <p>Enter username and password to continue.</p>
        <form method="GET">
          <input type="text" name="user" placeholder="Username" required><br>
          <input type="password" name="pass" placeholder="Password" required><br>
          <button type="submit">Login</button>
        </form>
      </div>
    </body>
    </html>
  `;

  return new Response(loginPage, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Protected Area"',
      'Content-Type': 'text/html'
    }
  });
}

// --- Helper to parse cookies ---
function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (!name) return;
    cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
}
