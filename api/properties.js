// GET  /api/properties          -> public list (hidden ones removed)
// GET  /api/properties?all=1    -> full list incl. hidden (admin only)
// PUT  /api/properties          -> replace full list (admin only)
import { del } from "@vercel/blob";
import { isAdmin, readProperties, writeProperties, cleanProperty } from "./_lib.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const all = req.query.all === "1";
      if (all && !isAdmin(req)) return res.status(401).json({ error: "Wrong password" });
      const list = await readProperties();
      if (all) {
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json(list);
      }
      res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
      return res.status(200).json(list.filter(p => !p.hidden));
    }

    if (req.method === "PUT") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Wrong password" });
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!Array.isArray(body?.properties)) return res.status(400).json({ error: "properties must be a list" });
      if (body.properties.length > 300) return res.status(400).json({ error: "Too many properties" });

      const next = body.properties.map(cleanProperty);
      const prev = await readProperties();

      await writeProperties(next);

      // Remove photos we uploaded that are no longer used by any property.
      const used = new Set(next.map(p => p.img));
      const orphaned = prev.map(p => p.img).filter(u => u && !used.has(u) && u.includes(".blob.vercel-storage.com/images/"));
      if (orphaned.length) await del(orphaned).catch(() => {});

      return res.status(200).json(next);
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    const msg = String(e?.message || e);
    const status = /required/.test(msg) ? 400 : 500;
    return res.status(status).json({ error: status === 400 ? msg : "Server error: " + msg });
  }
}
