// ===== Business contact =====
const WHATSAPP = "919117555126";

// ===== Property listings =====
// SAMPLE LISTINGS — replace these with Sinha Property Solution's real, current properties.
// deal: "rent" | "buy" | "lease"   type: "residential" | "commercial" | "land" | "industrial"
const PROPERTIES = [
  { title: "2 BHK Furnished Flat", deal: "rent", type: "residential", locality: "Boring Road",
    price: "₹18,000", unit: "/month", feats: ["2 Beds", "2 Baths", "1,050 sq ft"],
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=70" },
  { title: "Independent House (G+1)", deal: "rent", type: "residential", locality: "Kurji",
    price: "₹30,000", unit: "/month", feats: ["4 Beds", "3 Baths", "Parking"],
    img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=70" },
  { title: "Luxury Bungalow", deal: "buy", type: "residential", locality: "Patliputra Colony",
    price: "On request", unit: "", feats: ["5 Beds", "Garden", "3,200 sq ft"],
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=70" },
  { title: "Main Road Showroom", deal: "rent", type: "commercial", locality: "Boring Road",
    price: "₹85,000", unit: "/month", feats: ["Ground floor", "Glass front", "1,400 sq ft"],
    img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=70" },
  { title: "Office Space", deal: "rent", type: "commercial", locality: "Fraser Road",
    price: "₹45,000", unit: "/month", feats: ["Furnished", "Lift", "900 sq ft"],
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=70" },
  { title: "Warehouse / Godown", deal: "lease", type: "industrial", locality: "Danapur",
    price: "₹1,20,000", unit: "/month", feats: ["Truck access", "High ceiling", "8,000 sq ft"],
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=70" },
  { title: "Agricultural Land", deal: "lease", type: "land", locality: "Bihta",
    price: "On request", unit: "", feats: ["Irrigated", "Road facing", "2 acres"],
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=70" },
  { title: "Residential Plot", deal: "buy", type: "land", locality: "Danapur",
    price: "On request", unit: "", feats: ["Clear title", "East facing", "2,400 sq ft"],
    img: "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=800&q=70" },
  { title: "3 BHK Apartment", deal: "buy", type: "residential", locality: "Rajendra Nagar",
    price: "On request", unit: "", feats: ["3 Beds", "3 Baths", "1,450 sq ft"],
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=70" },
];

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
          <img src="${p.img}" alt="${p.title} in ${p.locality}" loading="lazy" />
          <span class="tag">${DEAL_LABEL[p.deal]}</span>
        </div>
        <div class="prop-body">
          <div class="price">${p.price} <small>${p.unit}</small></div>
          <h3>${p.title}</h3>
          <div class="loc">📍 ${p.locality}, Patna · ${TYPE_LABEL[p.type]}</div>
          <div class="feats">${p.feats.map(f => `<span>${f}</span>`).join("")}</div>
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
  locSelect.insertAdjacentHTML("beforeend", `<option value="${l}">${l}</option>`);
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
render();
