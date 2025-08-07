// Entry for Deno Deploy (and local dev)
import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { handleRequest } from "./src/server.ts";

const port = Number(Deno.env.get("PORT") || 8000);
console.log("Starting Deno Edge CDN on port", port);

// For Deno Deploy the `serve(handleRequest)` usage is recommended.
serve((req) => handleRequest(req));
