// ===== Business contact =====
const WHATSAPP = "919117555126";

// ===== Property listings =====
// Listings are managed from /admin and loaded from /api/properties.
let PROPERTIES = [];
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=60";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const LOCALITIES = ["Boring Road", "Kurji", "Patliputra Colony", "Rajendra Nagar", "Fraser Road",
  "Bailey Road", "Kankarbagh", "Ashiana Nagar", "Raja Bazar", "Danapur", "Bihta"];

const TYPE_LABEL = { residential: "Residential", commercial: "Commercial", land: "Land", industrial: "Industrial" };
const DEAL_LABEL = { rent: "For Rent", buy: "For Sale", lease: "For Lease" };

const filters = { deal: "all", type: "all", locality: "all" };
const grid = document.getElementById("propsGrid");

function render() {
  const list = PROPERTIES.filter(p =>
    (filters.deal === "all" || p.deal === filters.deal) &&
    (filters.type === "all" || p.type === filters.type) &&
    (filters.locality === "all" || p.locality === filters.locality));

  grid.innerHTML = list.map(p => {
    const msg = encodeURIComponent(`Hi, I'm interested in: ${p.title} (${DEAL_LABEL[p.deal]}) at ${p.locality}, Patna.`);
    return `
      <article class="card prop">
        <div class="prop-img">
          <img src="${esc(p.img || PLACEHOLDER_IMG)}" alt="${esc(p.title)} in ${esc(p.locality)}" loading="lazy" />
          <span class="tag">${DEAL_LABEL[p.deal] || ""}</span>
        </div>
        <div class="prop-body">
          <div class="price">${esc(p.price)} <small>${esc(p.unit)}</small></div>
          <h3>${esc(p.title)}</h3>
          <div class="loc">📍 ${esc(p.locality)}, Patna · ${TYPE_LABEL[p.type] || ""}</div>
          <div class="feats">${(p.feats || []).map(f => `<span>${esc(f)}</span>`).join("")}</div>
          <a class="btn btn-navy btn-sm" target="_blank" rel="noopener" href="https://wa.me/${WHATSAPP}?text=${msg}">Enquire on WhatsApp</a>
        </div>
      </article>`;
  }).join("");

  grid.scrollLeft = 0;
  grid.hidden = list.length === 0;
  document.getElementById("propsHint").hidden = list.length < 2;
  document.getElementById("emptyMsg").hidden = list.length > 0;
  const parts = [];
  if (filters.deal !== "all") parts.push(DEAL_LABEL[filters.deal].toLowerCase());
  if (filters.type !== "all") parts.push(TYPE_LABEL[filters.type].toLowerCase());
  if (filters.locality !== "all") parts.push("in " + filters.locality);
  document.getElementById("resultCount").textContent =
    `Showing ${list.length} ${list.length === 1 ? "property" : "properties"}${parts.length ? " · " + parts.join(", ") : ""}`;
}

function goToListings() {
  document.getElementById("properties").scrollIntoView({ behavior: "smooth" });
}

// Locality dropdown + chips
const locSelect = document.getElementById("fLocality");
const locList = document.getElementById("localityList");
LOCALITIES.forEach(l => {
  locSelect.add(new Option(l, l));
  const b = document.createElement("button");
  b.textContent = l;
  b.onclick = () => { filters.locality = locSelect.value = l; filters.type = "all"; document.getElementById("fType").value = "all"; render(); goToListings(); };
  locList.appendChild(b);
});

// Deal tabs
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  filters.deal = t.dataset.deal;
}));

// Search
document.getElementById("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  filters.type = document.getElementById("fType").value;
  filters.locality = locSelect.value;
  render();
  goToListings();
});

// Type chips
document.querySelectorAll(".type-chip").forEach(c => c.addEventListener("click", () => {
  filters.type = c.dataset.type;
  filters.deal = "all"; filters.locality = "all";
  document.getElementById("fType").value = c.dataset.type;
  locSelect.value = "all";
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.deal === "all"));
  render();
  goToListings();
}));

// Enquiry form -> WhatsApp
document.getElementById("enquiryForm").addEventListener("submit", e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const text = `New enquiry from website\nName: ${d.name}\nPhone: ${d.phone}\nWant to: ${d.deal}\nType: ${d.type}\nArea/Budget: ${d.area || "-"}\nMessage: ${d.msg || "-"}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
});

// Mobile menu
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
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

// Header shadow
const header = document.getElementById("header");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 10));

document.getElementById("year").textContent = new Date().getFullYear();

async function loadProperties() {
  document.getElementById("resultCount").textContent = "Loading properties…";
  try {
    const r = await fetch("/api/properties");
    if (!r.ok) throw new Error(r.status);
    PROPERTIES = await r.json();
  } catch {
    PROPERTIES = [];
  }
  // Add any new localities used in listings to the search dropdown
  const known = new Set([...locSelect.options].map(o => o.value));
  [...new Set(PROPERTIES.map(p => p.locality))].filter(l => l && !known.has(l)).forEach(l => locSelect.add(new Option(l, l)));
  render();
}
loadProperties();
