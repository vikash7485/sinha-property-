// Shared helpers for the API (files starting with "_" are not routes).
import { timingSafeEqual } from "node:crypto";
import { head, put } from "@vercel/blob";

export const DATA_PATH = "data/properties.json";

// Shown until the admin saves the first time. Delete or edit them from /admin.
export const SEED = [
  { id: "s1", title: "2 BHK Furnished Flat", deal: "rent", type: "residential", locality: "Boring Road", price: "₹18,000", unit: "/month", feats: ["2 Beds", "2 Baths", "1,050 sq ft"], img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=70", hidden: false },
  { id: "s2", title: "Independent House (G+1)", deal: "rent", type: "residential", locality: "Kurji", price: "₹30,000", unit: "/month", feats: ["4 Beds", "3 Baths", "Parking"], img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=70", hidden: false },
  { id: "s3", title: "Luxury Bungalow", deal: "buy", type: "residential", locality: "Patliputra Colony", price: "On request", unit: "", feats: ["5 Beds", "Garden", "3,200 sq ft"], img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=70", hidden: false },
  { id: "s4", title: "Main Road Showroom", deal: "rent", type: "commercial", locality: "Boring Road", price: "₹85,000", unit: "/month", feats: ["Ground floor", "Glass front", "1,400 sq ft"], img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=70", hidden: false },
  { id: "s5", title: "Office Space", deal: "rent", type: "commercial", locality: "Fraser Road", price: "₹45,000", unit: "/month", feats: ["Furnished", "Lift", "900 sq ft"], img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=70", hidden: false },
  { id: "s6", title: "Warehouse / Godown", deal: "lease", type: "industrial", locality: "Danapur", price: "₹1,20,000", unit: "/month", feats: ["Truck access", "High ceiling", "8,000 sq ft"], img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=70", hidden: false },
  { id: "s7", title: "Agricultural Land", deal: "lease", type: "land", locality: "Bihta", price: "On request", unit: "", feats: ["Irrigated", "Road facing", "2 acres"], img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=70", hidden: false },
  { id: "s8", title: "Residential Plot", deal: "buy", type: "land", locality: "Danapur", price: "On request", unit: "", feats: ["Clear title", "East facing", "2,400 sq ft"], img: "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=800&q=70", hidden: false },
  { id: "s9", title: "3 BHK Apartment", deal: "buy", type: "residential", locality: "Rajendra Nagar", price: "On request", unit: "", feats: ["3 Beds", "3 Baths", "1,450 sq ft"], img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=70", hidden: false },
];

export function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const given = String(req.headers["x-admin-key"] || "");
  if (!expected || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readProperties() {
  try {
    const meta = await head(DATA_PATH);
    const r = await fetch(`${meta.url}?v=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw new Error("fetch " + r.status);
    const data = await r.json();
    return Array.isArray(data) ? data : SEED;
  } catch (e) {
    if (e?.name === "BlobNotFoundError" || /not.?found|does not exist/i.test(String(e?.message))) return SEED;
    throw e;
  }
}

export async function writeProperties(list) {
  await put(DATA_PATH, JSON.stringify(list), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

const DEALS = ["rent", "buy", "lease"];
const TYPES = ["residential", "commercial", "land", "industrial"];
const str = (v, max) => String(v ?? "").trim().slice(0, max);

// Validates and cleans one property coming from the admin page.
export function cleanProperty(p) {
  const img = str(p.img, 600);
  const out = {
    id: str(p.id, 40) || Math.random().toString(36).slice(2, 10),
    title: str(p.title, 80),
    deal: DEALS.includes(p.deal) ? p.deal : "rent",
    type: TYPES.includes(p.type) ? p.type : "residential",
    locality: str(p.locality, 60),
    price: str(p.price, 30) || "On request",
    unit: str(p.unit, 20),
    feats: (Array.isArray(p.feats) ? p.feats : []).map(f => str(f, 30)).filter(Boolean).slice(0, 6),
    img: /^https:\/\//.test(img) ? img : "",
    hidden: !!p.hidden,
  };
  if (!out.title || !out.locality) throw new Error("Title and locality are required");
  return out;
}
