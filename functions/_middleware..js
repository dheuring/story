export async function onRequest(context) {
  return new Response('MIDDLEWARE IS ACTIVE', { status: 200 });
}