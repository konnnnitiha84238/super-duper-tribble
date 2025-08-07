const CACHE_NAME = Deno.env.get("CACHE_NAME") || "edge-cdn-cache";

export async function open() {
  return await caches.open(CACHE_NAME);
}

export async function match(req: Request) {
  try {
    const c = await open();
    const r = await c.match(req);
    return r;
  } catch (e) {
    console.warn("cache.match error", e);
    return null;
  }
}

export async function put(req: Request, resp: Response, cacheControl = "public, max-age=60") {
  try {
    const c = await open();
    // Ensure cache-control header present
    const headers = new Headers(resp.headers);
    headers.set("cache-control", cacheControl);
    const body = await resp.arrayBuffer();
    const r = new Response(body, { status: resp.status, headers });
    await c.put(req, r);
  } catch (e) {
    console.warn("cache.put error", e);
  }
}

export async function deleteKey(req: Request) {
  try {
    const c = await open();
    return await c.delete(req);
  } catch (e) {
    console.warn("cache.delete error", e);
    return false;
  }
}
