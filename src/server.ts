import { getOriginForRequest } from "./origin.ts";
import * as cacheUtil from "./cache.ts";
import { handlePurgeRequest } from "./purge.ts";
import { setCorsHeaders } from "./utils.ts";

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // PURGE endpoint (POST)
  if (url.pathname === "/_purge" && req.method === "POST") {
    return await handlePurgeRequest(req);
  }

  // Proxy/cache flow only for GET/HEAD/OPTIONS (pass through others)
  if (req.method === "OPTIONS") {
    const resp = new Response(null, { status: 204 });
    setCorsHeaders(resp.headers);
    return resp;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    // Pass-through to origin for non-cacheable methods
    const origin = getOriginForRequest(req);
    const originResp = await fetch(new URL(url.pathname + url.search, origin).toString(), {
      method: req.method,
      headers: req.headers,
      body: req.body,
      redirect: "manual"
    });
    return originResp;
  }

  // GET/HEAD: attempt cache
  const origin = getOriginForRequest(req);
  const originUrl = new URL(url.pathname + url.search, origin).toString();
  const cacheKey = new Request(originUrl);

  const cached = await cacheUtil.match(cacheKey);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("x-edge-cache", "HIT");
    setCorsHeaders(headers);
    return new Response(cached.body, { status: cached.status, headers });
  }

  // Miss -> fetch origin
  const reqHeaders = new Headers(req.headers);
  // Ensure host header matches origin host
  try { reqHeaders.set("host", new URL(origin).host); } catch {}
  const originResp = await fetch(originUrl, { method: req.method, headers: reqHeaders, redirect: "manual" });

  // Do not cache if Set-Cookie or 5xx
  if (originResp.headers.has("set-cookie") || originResp.status >= 500) {
    const passthruHeaders = new Headers(originResp.headers);
    passthruHeaders.set("x-edge-cache", "BYPASS");
    setCorsHeaders(passthruHeaders);
    return new Response(originResp.body, { status: originResp.status, headers: passthruHeaders });
  }

  // Decide cache-control
  const cc = originResp.headers.get("cache-control") || "public, max-age=60";

  // Read body fully to cache
  const buf = await originResp.arrayBuffer();
  const headersForCache = new Headers(originResp.headers);
  headersForCache.set("cache-control", cc);

  const toCache = new Response(buf.slice(0), { status: originResp.status, headers: headersForCache });
  try { await cacheUtil.put(cacheKey, toCache.clone(), cc); } catch (e) {
    console.warn("cache put failed", e);
  }

  const outHeaders = new Headers(headersForCache);
  outHeaders.set("x-edge-cache", "MISS");
  setCorsHeaders(outHeaders);
  return new Response(buf, { status: originResp.status, headers: outHeaders });
}
