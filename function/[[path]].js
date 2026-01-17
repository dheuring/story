export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    return Response.redirect(`${url.origin}/home.html`, 302);
  }

  return context.next();
}
