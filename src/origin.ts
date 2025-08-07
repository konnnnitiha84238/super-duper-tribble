// origin mapping
export function getOriginForRequest(req: Request): string {
  // If ORIGINS env provided as JSON map, use host header to map
  const origins = Deno.env.get("ORIGINS");
  if (origins) {
    try {
      const map = JSON.parse(origins) as Record<string,string>;
      const host = req.headers.get("host") || "";
      if (map[host]) return map[host];
    } catch {
      // ignore parse error
    }
  }
  const ORIGIN = Deno.env.get("ORIGIN");
  if (!ORIGIN) throw new Error("ORIGIN not set");
  return ORIGIN;
}
