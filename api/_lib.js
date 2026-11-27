// Shared helpers for the API (files starting with "_" are not routes).
import { timingSafeEqual } from "node:crypto";
import { head, put } from "@vercel/blob";

export const DATA_PATH = "data/properties.json";

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
const FURNISH = ["Furnished", "Semi-Furnished", "Unfurnished"];
const str = (v, max) => String(v ?? "").trim().slice(0, max);
const num = (v, max) => { const n = String(v ?? "").replace(/[^\d.]/g, ""); return n && Number(n) <= max ? String(Number(n)) : ""; };

// "₹18,000" -> 18000, "45 Lakh" / "45 L" -> 4500000, "1.2 Cr" -> 12000000, "On request" -> 0
export function parsePrice(text) {
  const t = String(text || "").toLowerCase().replace(/,/g, "");
  const m = t.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (/cr/.test(t)) n *= 1e7;
  else if (/lac|lakh|\d\s*l\b/.test(t)) n *= 1e5;
  else if (/\d\s*k\b/.test(t)) n *= 1e3;
  return Math.round(n);
}

// Validates and cleans one property coming from the admin page.
export function cleanProperty(p) {
  const url = u => { const s = str(u, 600); return /^https:\/\//.test(s) ? s : ""; };
  const imgs = (Array.isArray(p.imgs) ? p.imgs : []).concat(p.img ? [p.img] : []).map(url).filter(Boolean);
  const uniq = [...new Set(imgs)].slice(0, 10);
  const price = str(p.price, 30) || "On request";
  const out = {
    id: str(p.id, 40) || Math.random().toString(36).slice(2, 10),
    title: str(p.title, 80),
    deal: DEALS.includes(p.deal) ? p.deal : "rent",
    type: TYPES.includes(p.type) ? p.type : "residential",
    locality: str(p.locality, 60),
    price,
    priceNum: parsePrice(price),
    unit: str(p.unit, 20),
    bhk: num(p.bhk, 20),
    baths: num(p.baths, 20),
    area: num(p.area, 10000000),
    furnishing: FURNISH.includes(p.furnishing) ? p.furnishing : "",
    floor: str(p.floor, 30),
    parking: str(p.parking, 30),
    facing: str(p.facing, 20),
    desc: str(p.desc, 1500),
    feats: (Array.isArray(p.feats) ? p.feats : []).map(f => str(f, 30)).filter(Boolean).slice(0, 8),
    imgs: uniq,
    img: uniq[0] || "",
    featured: !!p.featured,
    hidden: !!p.hidden,
    created: Number(p.created) > 0 ? Number(p.created) : Date.now(),
  };
  if (!out.title || !out.locality) throw new Error("Title and locality are required");
  return out;
}

// Shown until the admin saves the first time. Delete or edit them from /admin.
export const SEED = [
  { id: "s1", title: "2 BHK Furnished Flat", deal: "rent", type: "residential", locality: "Boring Road", price: "₹18,000", unit: "/month", bhk: "2", baths: "2", area: "1050", furnishing: "Furnished", floor: "3rd of 5", parking: "1 Covered", facing: "East", featured: true, feats: ["Lift", "Power backup", "24x7 water"], desc: "Well-maintained 2 BHK in a quiet lane off Boring Road. Modular kitchen, wardrobes in both bedrooms, close to market, schools and hospitals.", imgs: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=70", "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=70", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70"] },
  { id: "s2", title: "Independent House (G+1)", deal: "rent", type: "residential", locality: "Kurji", price: "₹30,000", unit: "/month", bhk: "4", baths: "3", area: "2200", furnishing: "Semi-Furnished", floor: "G+1", parking: "2 Covered", facing: "North", feats: ["Terrace", "Family only"], desc: "Spacious independent house with private terrace and parking for two cars.", imgs: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=70"] },
  { id: "s3", title: "Luxury Bungalow", deal: "buy", type: "residential", locality: "Patliputra Colony", price: "₹2.5 Cr", unit: "", bhk: "5", baths: "5", area: "3200", furnishing: "Furnished", floor: "G+2", parking: "3 Covered", facing: "East", featured: true, feats: ["Garden", "Clear title"], desc: "Premium bungalow in Patliputra Colony with landscaped garden.", imgs: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=70"] },
  { id: "s4", title: "Main Road Showroom", deal: "rent", type: "commercial", locality: "Boring Road", price: "₹85,000", unit: "/month", area: "1400", floor: "Ground", feats: ["Glass front", "High footfall"], imgs: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=70"] },
  { id: "s5", title: "Office Space", deal: "rent", type: "commercial", locality: "Fraser Road", price: "₹45,000", unit: "/month", area: "900", furnishing: "Furnished", floor: "4th", parking: "2 Open", feats: ["Lift", "Power backup"], imgs: ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=70"] },
  { id: "s6", title: "Warehouse / Godown", deal: "lease", type: "industrial", locality: "Danapur", price: "₹1,20,000", unit: "/month", area: "8000", feats: ["Truck access", "High ceiling"], imgs: ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=70"] },
  { id: "s7", title: "Agricultural Land (2 acres)", deal: "lease", type: "land", locality: "Bihta", price: "On request", unit: "", area: "87120", feats: ["Irrigated", "Road facing"], imgs: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=70"] },
  { id: "s8", title: "Residential Plot", deal: "buy", type: "land", locality: "Danapur", price: "₹45 Lakh", unit: "", area: "2400", facing: "East", feats: ["Clear title"], imgs: ["https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=70"] },
  { id: "s9", title: "3 BHK Apartment", deal: "buy", type: "residential", locality: "Rajendra Nagar", price: "₹85 Lakh", unit: "", bhk: "3", baths: "3", area: "1450", furnishing: "Unfurnished", floor: "5th of 8", parking: "1 Covered", facing: "North-East", feats: ["Lift", "Gated society"], imgs: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70"] },
].map((p, i) => cleanProperty({ ...p, created: Date.UTC(2026, 10, 1 + i) }));
