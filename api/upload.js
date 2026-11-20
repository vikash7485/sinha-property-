// POST /api/upload  { data: "data:image/jpeg;base64,..." }  (admin only)
// The admin page resizes photos in the browser first, so uploads stay small.
import { put } from "@vercel/blob";
import { isAdmin } from "./_lib.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAdmin(req)) return res.status(401).json({ error: "Wrong password" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(body?.data || "");
    if (!m) return res.status(400).json({ error: "Please choose a JPG, PNG or WEBP photo" });
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > 3 * 1024 * 1024) return res.status(413).json({ error: "Photo is too large (max 3 MB)" });

    const blob = await put(`images/property.${TYPES[m[1]]}`, buf, {
      access: "public",
      addRandomSuffix: true,
      contentType: m[1],
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    return res.status(500).json({ error: "Upload failed: " + String(e?.message || e) });
  }
}
