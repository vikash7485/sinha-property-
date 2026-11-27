// ===== Business contact =====
const WHATSAPP = "919117555126";
const PHONE = "+919117555126";
const SITE_NAME = "Sinha Property Solution";

// ===== Helpers =====
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const waLink = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
// 1850000 -> "₹18.5 L", 25000000 -> "₹2.5 Cr", 18000 -> "₹18,000"
function inr(n, short = true) {
  n = Math.round(n);
  if (short && n >= 1e7) return "₹" + +(n / 1e7).toFixed(2) + " Cr";
  if (short && n >= 1e5) return "₹" + +(n / 1e5).toFixed(2) + " L";
  return "₹" + n.toLocaleString("en-IN");
}

// ===== Data =====
// Listings are managed from /admin and loaded from /api/properties.
let PROPERTIES = [];
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=60";
const LOCALITIES = ["Boring Road", "Kurji", "Patliputra Colony", "Rajendra Nagar", "Fraser Road",
  "Bailey Road", "Kankarbagh", "Ashiana Nagar", "Raja Bazar", "Danapur", "Bihta"];
const TYPE_LABEL = { residential: "Residential", commercial: "Commercial", land: "Land", industrial: "Industrial" };
const DEAL_LABEL = { rent: "For Rent", buy: "For Sale", lease: "For Lease" };
const NEW_DAYS = 14;

const photosOf = p => (p.imgs && p.imgs.length ? p.imgs : (p.img ? [p.img] : [PLACEHOLDER_IMG]));
const isNew = p => p.created && Date.now() - p.created < NEW_DAYS * 864e5;
const priceNum = p => p.priceNum || 0;
function specsOf(p) {
  const out = [];
  if (p.bhk) out.push(`${p.bhk} BHK`);
  if (p.baths) out.push(`${p.baths} Bath`);
  if (p.area) out.push(`${Number(p.area).toLocaleString("en-IN")} sq ft`);
  if (!out.length && p.furnishing) out.push(p.furnishing);
  return out;
}

// ===== Filters & shortlist =====
const filters = { deal: "all", type: "all", locality: "all", bhk: "", budget: "", sort: "featured", saved: false };
let saved = new Set(store.get("spSaved", []));

const BUDGETS = {
  rent: [["", "Any budget"], ["0-10000", "Under ₹10,000/mo"], ["10000-20000", "₹10k – 20k/mo"], ["20000-50000", "₹20k – 50k/mo"], ["50000-", "Above ₹50k/mo"]],
  buy: [["", "Any budget"], ["0-3000000", "Under ₹30 Lakh"], ["3000000-6000000", "₹30 – 60 Lakh"], ["6000000-10000000", "₹60 L – 1 Cr"], ["10000000-", "Above ₹1 Cr"]],
};
function fillBudget() {
  const sel = $("fBudget");
  const opts = filters.deal === "buy" ? BUDGETS.buy : (filters.deal === "all" ? [["", "Any budget"]] : BUDGETS.rent);
  sel.innerHTML = opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join("");
  sel.disabled = filters.deal === "all";
  sel.title = filters.deal === "all" ? "Pick Rent, Buy or Lease above to filter by budget" : "";
  if (!opts.some(o => o[0] === filters.budget)) filters.budget = "";
  sel.value = filters.budget;
}

function filtered() {
  const [bMin, bMax] = filters.budget ? filters.budget.split("-").map(x => x === "" ? Infinity : +x) : [0, Infinity];
  let list = PROPERTIES.filter(p =>
    (filters.deal === "all" || p.deal === filters.deal) &&
    (filters.type === "all" || p.type === filters.type) &&
    (filters.locality === "all" || p.locality === filters.locality) &&
    (!filters.bhk || (filters.bhk === "4" ? +p.bhk >= 4 : p.bhk === filters.bhk)) &&
    (!filters.budget || (priceNum(p) > 0 && priceNum(p) >= bMin && priceNum(p) <= bMax)) &&
    (!filters.saved || saved.has(p.id)));
  const byNew = (a, b) => (b.created || 0) - (a.created || 0);
  const priced = (a, b, dir) => {
    const x = priceNum(a), y = priceNum(b);
    if (!x !== !y) return x ? -1 : 1; // "On request" always last
    return dir * (x - y);
  };
  if (filters.sort === "new") list.sort(byNew);
  else if (filters.sort === "low") list.sort((a, b) => priced(a, b, 1));
  else if (filters.sort === "high") list.sort((a, b) => priced(a, b, -1));
  else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || byNew(a, b));
  return list;
}

function cardHTML(p) {
  const photos = photosOf(p);
  const specs = specsOf(p);
  const isSaved = saved.has(p.id);
  return `
    <article class="card prop" data-id="${esc(p.id)}">
      <div class="prop-img">
        <a href="#property-${encodeURIComponent(p.id)}" class="prop-link" aria-label="View details: ${esc(p.title)}">
          <img src="${esc(photos[0])}" alt="${esc(p.title)} in ${esc(p.locality)}" loading="lazy" />
        </a>
        <div class="badges">
          <span class="tag">${DEAL_LABEL[p.deal] || ""}</span>
          ${p.featured ? '<span class="tag tag-feat">★ Featured</span>' : ""}
          ${isNew(p) ? '<span class="tag tag-new">New</span>' : ""}
        </div>
        <button type="button" class="heart ${isSaved ? "on" : ""}" data-save="${esc(p.id)}" aria-pressed="${isSaved}" aria-label="${isSaved ? "Remove from saved" : "Save property"}">${isSaved ? "♥" : "♡"}</button>
        ${photos.length > 1 ? `<span class="photo-count">📷 ${photos.length}</span>` : ""}
      </div>
      <div class="prop-body">
        <div class="price">${esc(p.price)} <small>${esc(p.unit)}</small></div>
        <h3><a href="#property-${encodeURIComponent(p.id)}">${esc(p.title)}</a></h3>
        <div class="loc">📍 ${esc(p.locality)}, Patna · ${TYPE_LABEL[p.type] || ""}</div>
        ${specs.length ? `<div class="specs">${specs.map(s => `<span>${esc(s)}</span>`).join("")}</div>` : ""}
        <div class="prop-actions">
          <a class="btn btn-navy btn-sm" href="#property-${encodeURIComponent(p.id)}">View details</a>
          <a class="btn btn-sm btn-wa-icon" target="_blank" rel="noopener" aria-label="Enquire on WhatsApp"
             href="${waLink(`Hi, I'm interested in: ${p.title} (${DEAL_LABEL[p.deal]}) at ${p.locality}, Patna.`)}">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"/></svg>
          </a>
        </div>
      </div>
    </article>`;
}

const grid = $("propsGrid");
function render() {
  const list = filtered();
  grid.innerHTML = list.map(cardHTML).join("");
  grid.scrollLeft = 0;
  grid.hidden = list.length === 0;
  $("propsHint").hidden = list.length < 2;
  $("emptyMsg").hidden = list.length > 0;
  $("emptyMsg").innerHTML = filters.saved && !saved.size
    ? "You haven't saved any property yet — tap the ♡ on a property to save it."
    : `No listed property matches right now — <a href="#contact">tell us what you need</a> and we'll find it for you.`;

  const parts = [];
  if (filters.deal !== "all") parts.push(DEAL_LABEL[filters.deal].toLowerCase());
  if (filters.type !== "all") parts.push(TYPE_LABEL[filters.type].toLowerCase());
  if (filters.bhk) parts.push(filters.bhk === "4" ? "4+ BHK" : filters.bhk + " BHK");
  if (filters.locality !== "all") parts.push("in " + filters.locality);
  if (filters.saved) parts.push("saved");
  $("resultCount").textContent = `Showing ${list.length} ${list.length === 1 ? "property" : "properties"}${parts.length ? " · " + parts.join(", ") : ""}`;

  document.querySelectorAll("#bhkChips .chip").forEach(c => c.classList.toggle("active", c.dataset.bhk === filters.bhk));
  $("savedCount").textContent = saved.size;
  $("savedBtn").classList.toggle("on", filters.saved);
  $("savedBtn").setAttribute("aria-pressed", filters.saved);
  $("savedBtn").firstChild.textContent = filters.saved ? "♥ Saved " : "♡ Saved ";
  const active = filters.deal !== "all" || filters.type !== "all" || filters.locality !== "all" || filters.bhk || filters.budget || filters.saved;
  $("clearFilters").hidden = !active;
}

function toggleSave(id) {
  saved.has(id) ? saved.delete(id) : saved.add(id);
  store.set("spSaved", [...saved]);
  render();
  if (openId === id) syncSaveBtn(id);
}

function setDeal(deal) {
  filters.deal = deal;
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.deal === deal));
  fillBudget();
}
function goToListings() { $("properties").scrollIntoView({ behavior: "smooth" }); }

// Locality dropdown + "Areas we serve" pills
const locSelect = $("fLocality");
LOCALITIES.forEach(l => {
  locSelect.add(new Option(l, l));
  const b = document.createElement("button");
  b.textContent = l;
  b.onclick = () => { filters.locality = locSelect.value = l; filters.type = "all"; $("fType").value = "all"; render(); goToListings(); };
  $("localityList").appendChild(b);
});

document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => setDeal(t.dataset.deal)));

$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  filters.type = $("fType").value;
  filters.locality = locSelect.value;
  render();
  goToListings();
});

document.querySelectorAll(".type-chip").forEach(c => c.addEventListener("click", () => {
  filters.type = c.dataset.type; filters.locality = "all"; filters.bhk = "";
  $("fType").value = c.dataset.type; locSelect.value = "all";
  setDeal("all");
  render();
  goToListings();
}));

$("bhkChips").addEventListener("click", e => {
  const c = e.target.closest(".chip"); if (!c) return;
  filters.bhk = c.dataset.bhk; render();
});
$("fBudget").addEventListener("change", e => { filters.budget = e.target.value; render(); });
$("fSort").addEventListener("change", e => { filters.sort = e.target.value; render(); });
$("savedBtn").addEventListener("click", () => { filters.saved = !filters.saved; render(); });
$("clearFilters").addEventListener("click", () => {
  Object.assign(filters, { type: "all", locality: "all", bhk: "", budget: "", saved: false });
  $("fType").value = "all"; locSelect.value = "all";
  setDeal("all");
  render();
});
grid.addEventListener("click", e => {
  const h = e.target.closest("[data-save]");
  if (h) { e.preventDefault(); toggleSave(h.dataset.save); }
});

// ===== Property detail =====
const pd = $("pd");
let openId = null;
let lastFocus = null;

function syncSaveBtn(id) {
  const on = saved.has(id);
  $("pdSave").textContent = on ? "♥" : "♡";
  $("pdSave").classList.toggle("on", on);
  $("pdSave").setAttribute("aria-pressed", on);
  $("pdSave").setAttribute("aria-label", on ? "Remove from saved" : "Save property");
}

function openDetail(id) {
  const p = PROPERTIES.find(x => x.id === id);
  if (!p) return closeDetail(false);
  if (pd.hidden) lastFocus = document.activeElement;
  openId = id;
  const photos = photosOf(p);
  const specs = [
    ["🛏", "Bedrooms", p.bhk && `${p.bhk} BHK`],
    ["🛁", "Bathrooms", p.baths],
    ["📐", "Area", p.area && `${Number(p.area).toLocaleString("en-IN")} sq ft`],
    ["🛋", "Furnishing", p.furnishing],
    ["🏢", "Floor", p.floor],
    ["🚗", "Parking", p.parking],
    ["🧭", "Facing", p.facing],
    ["🏷", "Type", TYPE_LABEL[p.type]],
  ].filter(s => s[2]);
  const perSqft = p.deal === "buy" && priceNum(p) && +p.area ? `${inr(priceNum(p) / p.area, false)}/sq ft` : "";
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.locality + ", Patna, Bihar")}`;
  const score = x => (x.deal === p.deal) * 3 + (x.type === p.type) * 2 + (x.locality === p.locality);
  const similar = PROPERTIES.filter(x => x.id !== p.id && (x.type === p.type || x.locality === p.locality))
    .sort((a, b) => score(b) - score(a))
    .slice(0, 4);
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

  $("pdTopTitle").textContent = p.title;
  $("pdTrack").innerHTML = photos.map((u, i) =>
    `<img src="${esc(u)}" alt="${esc(p.title)} — photo ${i + 1} of ${photos.length}" ${i ? 'loading="lazy"' : ""} />`).join("");
  $("pdTrack").scrollLeft = 0;
  $("pdCount").textContent = photos.length > 1 ? `1 / ${photos.length}` : "";
  $("pdCount").hidden = photos.length < 2;
  $("pdPrev").hidden = $("pdNext").hidden = photos.length < 2;

  $("pdBody").innerHTML = `
    <div class="pd-badges">
      <span class="tag">${DEAL_LABEL[p.deal]}</span>
      ${p.featured ? '<span class="tag tag-feat">★ Featured</span>' : ""}
      ${isNew(p) ? '<span class="tag tag-new">New</span>' : ""}
    </div>
    <div class="pd-price">${esc(p.price)} <small>${esc(p.unit)}</small>${perSqft ? `<span class="pd-psf">${perSqft}</span>` : ""}</div>
    <h2 id="pdTitle">${esc(p.title)}</h2>
    <a class="pd-loc" href="${mapUrl}" target="_blank" rel="noopener">📍 ${esc(p.locality)}, Patna <span>· View on map ↗</span></a>

    ${specs.length ? `<div class="pd-specs">${specs.map(([i, l, v]) => `<div><span class="pd-si">${i}</span><small>${l}</small><b>${esc(v)}</b></div>`).join("")}</div>` : ""}

    ${p.desc ? `<h3>About this property</h3><p class="pd-desc">${esc(p.desc)}</p>` : ""}
    ${(p.feats || []).length ? `<h3>Highlights</h3><div class="pd-feats">${p.feats.map(f => `<span>✓ ${esc(f)}</span>`).join("")}</div>` : ""}

    <form class="pd-visit" id="visitForm">
      <h3>📅 Schedule a site visit</h3>
      <p>Pick a time — we'll confirm on WhatsApp.</p>
      <div class="pd-visit-row">
        <label>Date<input type="date" name="date" min="${today}" value="${today}" required /></label>
        <label>Time
          <select name="slot">
            <option>Morning (9–12)</option><option>Afternoon (12–4)</option><option>Evening (4–7)</option>
          </select>
        </label>
      </div>
      <label>Your name<input name="name" required maxlength="60" placeholder="e.g. Rahul Kumar" autocomplete="name" /></label>
      <button class="btn btn-gold btn-block">Request visit on WhatsApp</button>
    </form>

    ${similar.length ? `<h3>Similar properties</h3><div class="scroll-row pd-similar">${similar.map(s => `
      <a class="pd-sim" href="#property-${encodeURIComponent(s.id)}">
        <img src="${esc(photosOf(s)[0])}" alt="" loading="lazy" />
        <b>${esc(s.price)} <small>${esc(s.unit)}</small></b>
        <span>${esc(s.title)}</span>
        <small>📍 ${esc(s.locality)}</small>
      </a>`).join("")}</div>` : ""}
    <p class="pd-ref">Property ID: ${esc(p.id)}</p>`;

  const enquiry = `Hi, I'm interested in: ${p.title} (${DEAL_LABEL[p.deal]}, ${p.price}${p.unit ? " " + p.unit : ""}) at ${p.locality}, Patna.\nLink: ${location.origin}/#property-${p.id}`;
  $("pdWa").href = waLink(enquiry);
  syncSaveBtn(p.id);

  $("visitForm").addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const date = d.date ? new Date(d.date + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "";
    window.open(waLink(`Site visit request\nProperty: ${p.title} — ${p.locality}, Patna (ID ${p.id})\nDate: ${date}\nTime: ${d.slot}\nName: ${d.name}\nLink: ${location.origin}/#property-${p.id}`), "_blank", "noopener");
  });

  pd.hidden = false;
  document.body.classList.add("pd-open");
  pd.querySelector(".pd").scrollTop = 0;
  document.title = `${p.title}, ${p.locality} | ${SITE_NAME}`;
  $("pdClose").focus({ preventScroll: true });
}

function closeDetail(updateUrl = true) {
  if (pd.hidden) return;
  pd.hidden = true; openId = null;
  document.body.classList.remove("pd-open");
  document.title = `${SITE_NAME} | Real Estate Consultant in Patna`;
  if (updateUrl && location.hash.startsWith("#property-")) history.replaceState(null, "", location.pathname + location.search + "#properties");
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}

function routeFromHash() {
  const m = location.hash.match(/^#property-(.+)$/);
  if (m) openDetail(decodeURIComponent(m[1]));
  else closeDetail(false);
}
window.addEventListener("hashchange", routeFromHash);

$("pdClose").addEventListener("click", () => closeDetail());
pd.addEventListener("click", e => { if (e.target === pd) closeDetail(); });
document.addEventListener("keydown", e => {
  if (pd.hidden) return;
  if (e.key === "Escape") closeDetail();
  if (e.key === "ArrowRight") stepPhoto(1);
  if (e.key === "ArrowLeft") stepPhoto(-1);
});
$("pdSave").addEventListener("click", () => openId && toggleSave(openId));
$("pdShare").addEventListener("click", async () => {
  const p = PROPERTIES.find(x => x.id === openId); if (!p) return;
  const url = `${location.origin}/#property-${encodeURIComponent(p.id)}`;
  const text = `${p.title} — ${p.price}${p.unit ? " " + p.unit : ""}, ${p.locality}, Patna`;
  if (navigator.share) { try { await navigator.share({ title: p.title, text, url }); return; } catch (err) { if (err.name === "AbortError") return; } }
  window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank", "noopener");
});

// Gallery: swipe on phones, arrows on desktop, live counter
const track = $("pdTrack");
function stepPhoto(dir) { track.scrollBy({ left: dir * track.clientWidth, behavior: "smooth" }); }
$("pdPrev").addEventListener("click", () => stepPhoto(-1));
$("pdNext").addEventListener("click", () => stepPhoto(1));
track.addEventListener("scroll", () => {
  const n = track.children.length; if (n < 2) return;
  const i = Math.round(track.scrollLeft / track.clientWidth) + 1;
  $("pdCount").textContent = `${Math.min(i, n)} / ${n}`;
}, { passive: true });

// ===== EMI calculator =====
const emi = {
  amt: [$("emiAmt"), $("emiAmtN")],
  rate: [$("emiRate"), $("emiRateN")],
  yrs: [$("emiYrs"), $("emiYrsN")],
};
function calcEmi() {
  const P = +emi.amt[0].value, r = +emi.rate[0].value / 1200, n = +emi.yrs[0].value * 12;
  const m = r ? P * r * (1 + r) ** n / ((1 + r) ** n - 1) : P / n;
  const total = m * n, interest = total - P;
  $("emiOut").textContent = inr(m, false);
  $("emiP").textContent = inr(P);
  $("emiI").textContent = inr(interest);
  $("emiT").textContent = inr(total);
  $("emiBarP").style.width = (P / total * 100).toFixed(1) + "%";
  $("emiWhatsApp").href = waLink(`Hi, I'm looking to buy a property in Patna. My loan budget is about ${inr(P)} (EMI around ${inr(m, false)}/month). Please suggest options.`);
}
const fmtField = { amt: v => Number(v).toLocaleString("en-IN"), rate: v => (+v).toFixed(2).replace(/\.?0+$/, ""), yrs: v => v };
Object.entries(emi).forEach(([k, [range, box]]) => {
  box.value = fmtField[k](range.value);
  range.addEventListener("input", () => { box.value = fmtField[k](range.value); calcEmi(); });
  box.addEventListener("change", () => {
    let v = parseFloat(box.value.replace(/[^\d.]/g, ""));
    if (isNaN(v)) v = +range.value;
    v = Math.min(+range.max, Math.max(+range.min, v));
    range.value = v; box.value = fmtField[k](range.value); calcEmi();
  });
});
calcEmi();

// ===== Enquiry form -> WhatsApp =====
$("enquiryForm").addEventListener("submit", e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const text = `New enquiry from website\nName: ${d.name}\nPhone: ${d.phone}\nWant to: ${d.deal}\nType: ${d.type}\nArea/Budget: ${d.area || "-"}\nMessage: ${d.msg || "-"}`;
  window.open(waLink(text), "_blank", "noopener");
});

// ===== Mobile menu =====
const nav = $("nav");
const menuBtn = $("menuBtn");
function setMenu(open) {
  nav.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  menuBtn.textContent = open ? "✕" : "☰";
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
window.matchMedia("(min-width: 900px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

// Mobile contact bar: slide it away while the contact section is on screen
const mobileBar = $("mobileBar");
if (mobileBar && "IntersectionObserver" in window) {
  const visible = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
    mobileBar.classList.toggle("away", visible.size > 0);
  }, { threshold: 0.15 });
  ["enquiryForm", "contact"].forEach(id => { const el = $(id); if (el) io.observe(el.querySelector(".info-list") || el); });
}

// Header shadow
const header = $("header");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 10), { passive: true });

$("year").textContent = new Date().getFullYear();

// ===== Load listings =====
async function loadProperties() {
  $("resultCount").textContent = "Loading properties…";
  try {
    const r = await fetch("/api/properties");
    if (!r.ok) throw new Error(r.status);
    PROPERTIES = await r.json();
  } catch {
    PROPERTIES = [];
  }
  // Forget saved ids that no longer exist
  if (PROPERTIES.length) {
    const ids = new Set(PROPERTIES.map(p => p.id));
    saved = new Set([...saved].filter(id => ids.has(id)));
    store.set("spSaved", [...saved]);
  }
  // Add any new localities used in listings to the search dropdown
  const known = new Set([...locSelect.options].map(o => o.value));
  [...new Set(PROPERTIES.map(p => p.locality))].filter(l => l && !known.has(l)).forEach(l => locSelect.add(new Option(l, l)));
  render();
  routeFromHash();
}
fillBudget();
loadProperties();
