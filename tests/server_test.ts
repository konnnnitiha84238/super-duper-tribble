import { assert } from "https://deno.land/std@0.201.0/testing/asserts.ts";
import { handleRequest } from "../src/server.ts";

Deno.test("OPTIONS returns 204", async () => {
  const req = new Request("https://example.com/", { method: "OPTIONS" });
  const resp = await handleRequest(req);
  assert(resp.status === 204);
});
