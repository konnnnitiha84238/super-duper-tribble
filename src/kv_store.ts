// Simple wrapper for Deno KV to track cached URLs (optional)
export async function addKey(key: string) {
  if (Deno.env.get("USE_DENO_KV") !== "true") return;
  try {
    const kv = await Deno.openKv();
    await kv.set(["cache", key], { key, created: Date.now() });
  } catch (e) {
    console.warn("kv addKey failed", e);
  }
}

export async function deleteByPrefix(prefix: string) {
  try {
    const kv = await Deno.openKv();
    let deleted = 0;
    for await (const entry of kv.list({ prefix: ["cache", prefix] })) {
      const val = entry.value;
      const k = val.key;
      try {
        await fetch(k, { method: 'PURGE' }); // hint: not used; we'll instead ask caller to use cache.delete
      } catch {}
      // also remove kv entry
      await kv.delete(entry.key);
      deleted++;
    }
    return deleted;
  } catch (e) {
    console.warn("kv.deleteByPrefix failed", e);
    return 0;
  }
}
