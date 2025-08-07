import * as cache from "./cache.ts";
import * as kv from "./kv_store.ts";

export async function handlePurgeRequest(req: Request): Promise<Response> {
  const token = req.headers.get("x-purge-token") || "";
  const expected = Deno.env.get("PURGE_TOKEN") || "";
  if (!expected || token !== expected) return new Response("unauthorized", { status: 401 });

  let body = null;
  try { body = await req.json(); } catch {
    return new Response("invalid json", { status: 400 });
  }

  if (body.url) {
    const ok = await cache.deleteKey(new Request(body.url));
    return new Response(JSON.stringify({ purged: ok }), { status: ok ? 200 : 404, headers: { "content-type": "application/json" } });
  }

  // prefix purge (requires Deno KV)
  if (body.prefix) {
    if (Deno.env.get("USE_DENO_KV") !== "true") {
      return new Response(JSON.stringify({ error: "prefix purge requires USE_DENO_KV=true" }), { status: 400, headers: { "content-type":"application/json" }});
    }
    const deleted = await kv.deleteByPrefix(body.prefix);
    return new Response(JSON.stringify({ deleted }), { status: 200, headers: { "content-type": "application/json" }});
  }

  return new Response("missing url or prefix", { status: 400 });
}
