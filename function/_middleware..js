export async function onRequest() {
  return new Response('MIDDLEWARE IS RUNNING', { status: 418 });
}
