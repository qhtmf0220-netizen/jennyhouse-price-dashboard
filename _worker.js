export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/snapshot") {
      // GET: return the latest saved snapshot (or null if nothing uploaded yet)
      if (request.method === "GET") {
        const data = await env.SNAPSHOT_KV.get("latest");
        return new Response(data ?? "null", {
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        });
      }

      // POST: save a new snapshot (called after someone uploads an Excel file)
      if (request.method === "POST") {
        let text;
        try {
          text = await request.text();
          const parsed = JSON.parse(text);
          if (!parsed || !Array.isArray(parsed.snapshots)) throw new Error("bad shape");
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: "invalid payload" }), {
            status: 400,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        }
        await env.SNAPSHOT_KV.put("latest", text);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }

      return new Response("Method Not Allowed", { status: 405 });
    }

    // everything else: serve the static site as usual
    return env.ASSETS.fetch(request);
  },
};
