export async function onRequest({ request, env, next }) {
  const COOKIE = 'pages-auth';
  const USER = env.AUTH_USER || 'gukky';
  const PASS = env.AUTH_PASS || 'daaders';
  const TOKEN = btoa(`${USER}:${PASS}`);
  const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';
  const cookies = Object.fromEntries(
    (request.headers.get('cookie') || '')
      .split(';')
      .map(c => c.trim().split('='))
  );

  // ---- Always allow non-HTML assets ----
  if (!accept.includes('text/html')) {
    return next();
  }

  // ---- Logout ----
  if (url.pathname === '/logout') {
    return new Response('Logged out', {
      headers: {
        'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0`
      }
    });
  }

  // ---- Already logged in ----
  if (cookies[COOKIE] === TOKEN) {
    return next();
  }

  // ---- Login submission ----
  if (url.searchParams.has('user')) {
    const user = url.searchParams.get('user');
    const pass = url.searchParams.get('pass');

    if (btoa(`${user}:${pass}`) === TOKEN) {
      return Response.redirect(url.pathname, 302, {
        headers: {
          'Set-Cookie': `${COOKIE}=${TOKEN}; Path=/; Max-Age=${MAX_AGE}; HttpOnly`
        }
      });
    }
  }

  // ---- Login page ----
  return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>Login Required</title>
  <style>
    body { font-family: sans-serif; background: #f2f2f2; display:flex; justify-content:center; align-items:center; height:100vh; }
    form { background:#fff; padding:2rem; border-radius:8px; box-shadow:0 6px 20px rgba(0,0,0,.15); }
    input { display:block; width:100%; margin:.5rem 0; padding:.5rem; }
    button { width:100%; padding:.5rem; }
  </style>
</head>
<body>
  <form method="GET">
    <h2>Login</h2>
    <input name="user" placeholder="Username" required>
    <input name="pass" type="password" placeholder="Password" required>
    <button type="submit">Continue</button>
  </form>
</body>
</html>
`, {
    status: 401,
    headers: { 'Content-Type': 'text/html' }
  });
}
