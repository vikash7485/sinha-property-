// POST /api/login  (header x-admin-key) -> 200 if the password is right
import { isAdmin } from "./_lib.js";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: "Admin password is not set up on the server" });
  if (!isAdmin(req)) return res.status(401).json({ error: "Wrong password" });
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ok: true });
}
