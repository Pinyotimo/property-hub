import React, {
  useEffect, useRef, useState, createContext, useContext, useCallback,
} from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

/* ── Formatters ── */
const money = new Intl.NumberFormat("en-KE", {
  style: "currency", currency: "KES", maximumFractionDigits: 0,
});

/* ── API ── */
const api = {
  csrfToken: "",
  async request(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(path, {
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(api.csrfToken ? { "X-CSRFToken": api.csrfToken } : {}),
        ...options.headers,
      },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || firstError(data.errors) || "Request failed.");
    }
    return data;
  },
  get: (path, opts) => api.request(path, opts),
  post: (path, body, opts) =>
    api.request(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body), ...opts }),
  put: (path, body, opts) =>
    api.request(path, { method: "PUT", body: body instanceof FormData ? body : JSON.stringify(body), ...opts }),
  delete: (path, opts) => api.request(path, { method: "DELETE", ...opts }),
};

function firstError(errors) {
  if (!errors) return "";
  const field = Object.keys(errors)[0];
  const val = errors[field];
  return Array.isArray(val) ? val[0] : String(val);
}

/* ── Router ── */
function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function websocketUrl(path) {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${path}`;
}

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path.replace(/^\/app/, "") || "/";
}

/* ── Favourites (localStorage) ── */
function useFavourites() {
  const [favs, setFavs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ph_favs") || "[]")); }
    catch { return new Set(); }
  });

  const toggle = useCallback((id) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem("ph_favs", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  return [favs, toggle];
}

/* ── Toast ── */
function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return [toasts, add];
}

/* ── Context ── */
const AppContext = createContext(null);

function canManageListings(user) {
  return Boolean(user && (user.isSeller || user.isAdmin || user.role === "seller" || user.role === "admin"));
}

/* ============================================================
   CATEGORY / TYPE DEFINITIONS
   ============================================================ */

// Top-level categories shown as hero nav tabs
const CATEGORIES = [
  { key: "property",    label: "Property",    icon: "🏠", color: "#1a5c43" },
  { key: "vehicles",    label: "Vehicles",    icon: "🚗", color: "#c4571a" },
  { key: "machinery",   label: "Machinery",   icon: "⚙️", color: "#7a4a0c" },
  { key: "electronics", label: "Electronics", icon: "📱", color: "#1a3a5c" },
  { key: "furniture",   label: "Furniture",   icon: "🛋️", color: "#5c3a1a" },
  { key: "clothing",    label: "Clothing",    icon: "👗", color: "#8b1a5c" },
  { key: "household",   label: "Household",   icon: "🏺", color: "#1a5c5c" },
  { key: "plots",       label: "Plots & Land","icon": "📐", color: "#2d5c1a" },
];

const CATEGORY_CHOICES = CATEGORIES.map((c) => [c.key, c.label]);

// Property sub-types per category
const SUBCATEGORY_MAP = {
  property:    [["house","House"],["apartment","Apartment"],["commercial","Commercial"],["rental","Rental"],["bedsitter","Bedsitter"],["villa","Villa"],["townhouse","Townhouse"]],
  vehicles:    [["car","Car"],["motorbike","Motorbike"],["truck","Truck"],["bus","Bus"],["tuk_tuk","Tuk Tuk"],["bicycle","Bicycle"],["boat","Boat"],["trailer","Trailer"]],
  machinery:   [["construction","Construction"],["agricultural","Agricultural"],["industrial","Industrial"],["generator","Generator"],["pump","Pump"],["compressor","Compressor"],["other_machinery","Other"]],
  electronics: [["phone","Phone / Tablet"],["laptop","Laptop / Computer"],["tv","TV & Audio"],["camera","Camera"],["appliance","Home Appliance"],["gaming","Gaming"],["networking","Networking"],["other_elec","Other"]],
  furniture:   [["sofa","Sofa / Couch"],["bed","Bed & Mattress"],["table","Tables & Desks"],["chair","Chairs"],["wardrobe","Wardrobe"],["outdoor","Outdoor Furniture"],["office_furniture","Office Furniture"],["other_furn","Other"]],
  clothing:    [["mens","Men's Clothing"],["womens","Women's Clothing"],["kids","Kids' Clothing"],["shoes","Shoes & Footwear"],["bags","Bags & Accessories"],["traditional","Traditional Wear"],["sportswear","Sportswear"],["other_cloth","Other"]],
  household:   [["kitchen","Kitchen & Cookware"],["bedding","Bedding & Linen"],["decor","Home Décor"],["cleaning","Cleaning & Laundry"],["garden","Garden & Outdoor"],["tools","Tools & Hardware"],["storage","Storage & Organisation"],["other_hh","Other"]],
  plots:       [["residential_plot","Residential Plot"],["commercial_plot","Commercial Plot"],["agricultural_land","Agricultural Land"],["beach_plot","Beach Plot"],["industrial_land","Industrial Land"],["mixed_use","Mixed Use"],["other_land","Other"]],
};

const LISTING_TYPE_CHOICES = [["sale", "For Sale"], ["rent", "For Rent"], ["lease", "For Lease"], ["exchange", "Exchange"]];

const STATUS_CHOICES = [
  ["available", "Available"], ["sold", "Sold"], ["rented", "Rented"], ["pending", "Pending"],
];

// Condition only applies to physical goods
const CONDITION_CHOICES = [
  ["new","Brand New"],["like_new","Like New"],["good","Good"],["fair","Fair"],["for_parts","For Parts"],
];

// Fields that are only relevant for property/plots
const PROPERTY_CATEGORIES = new Set(["property", "plots"]);
const VEHICLE_CATEGORIES  = new Set(["vehicles"]);

/* ── App root ── */
export default function App() {
  const route = useRoute();
  const [session, setSession] = useState({ user: null, loading: true });
  const [notice, setNotice] = useState("");
  const [favs, toggleFav] = useFavourites();
  const [toasts, addToast] = useToast();

  async function refreshSession() {
    const data = await api.get("/api/accounts/session/");
    api.csrfToken = data.csrfToken;
    setSession({ user: data.user, loading: false });
  }

  useEffect(() => {
    refreshSession().catch(() => setSession({ user: null, loading: false }));
  }, []);

  const ctx = { user: session.user, setNotice, refreshSession, favs, toggleFav, addToast };

  return (
    <AppContext.Provider value={ctx}>
      <Nav />
      <main className="app-main">
        {notice && (
          <div className="notice" role="status">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            {notice}
          </div>
        )}
        {session.loading
          ? <div className="loading">Loading Property Hub…</div>
          : <Router route={route} />}
      </main>
      <ToastStack toasts={toasts} />
      <ScrollToTop />
    </AppContext.Provider>
  );
}

/* ── Toast stack ── */
function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1.5rem",
      display: "grid", gap: "0.5rem", zIndex: 200,
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: "0.75rem 1.1rem",
          background: t.type === "error" ? "var(--danger-light)" : "var(--surface)",
          border: `1px solid ${t.type === "error" ? "#f5c6c3" : "var(--surface-strong)"}`,
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-lg)",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: t.type === "error" ? "#8b1a1a" : "var(--ink)",
          maxWidth: 320,
          animation: "fade-up 0.25s var(--ease-out) both",
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ── Scroll to top ── */
function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      style={{
        position: "fixed", bottom: "1.5rem", left: "1.5rem",
        width: 40, height: 40, borderRadius: "50%",
        background: "var(--surface)", border: "1px solid var(--surface-strong)",
        boxShadow: "var(--shadow)", cursor: "pointer", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink-70)", fontSize: "1.1rem",
        animation: "fade-in 0.2s var(--ease-out) both",
      }}
    >
      ↑
    </button>
  );
}

/* ── Router ── */
function Router({ route }) {
  const parts = route.split("/").filter(Boolean);
  if (route === "/" || route === "/listings") return <ListingsPage />;
  if (route === "/login") return <LoginPage />;
  if (route === "/register") return <RegisterPage />;
  if (route === "/new") return <RequireSeller><PropertyFormPage /></RequireSeller>;
  if (parts[0] === "properties" && parts[1] && parts[2] === "edit") {
    return <RequireSeller><PropertyFormPage propertyId={parts[1]} /></RequireSeller>;
  }
  if (parts[0] === "properties" && parts[1] && parts[2] === "messages") {
    return <RequireAuth><ChatPage propertyId={parts[1]} /></RequireAuth>;
  }
  if (parts[0] === "properties" && parts[1]) return <PropertyDetail propertyId={parts[1]} />;
  return <NotFound />;
}

function RequireAuth({ children }) {
  const { user } = useContext(AppContext);
  useEffect(() => {
    if (!user) {
      sessionStorage.setItem("postLoginPath", window.location.pathname);
      navigate("/app/login");
    }
  }, [user]);
  if (!user) return <div className="loading">Checking your session…</div>;
  return children;
}

function RequireSeller({ children }) {
  const { user } = useContext(AppContext);
  if (!user) return <RequireAuth>{children}</RequireAuth>;
  if (!canManageListings(user)) {
    return <Empty title="Seller access required" text="Use a seller or admin account to manage listings." />;
  }
  return children;
}

function Link({ to, className = "", children, onClick }) {
  return (
    <a
      href={`/app${to}`}
      className={className}
      onClick={(e) => { e.preventDefault(); onClick?.(); navigate(`/app${to}`); }}
    >
      {children}
    </a>
  );
}

/* ============================================================
   NAV
   ============================================================ */
function Nav() {
  const { user, refreshSession, setNotice } = useContext(AppContext);
  const route = useRoute();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const closeMenu = () => setOpen(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await api.post("/api/accounts/logout/", {});
      await refreshSession();
      setNotice("You have been logged out.");
      closeMenu();
      navigate("/app/");
    } catch (err) {
      setNotice(err.message || "Logout failed.");
    } finally {
      setLoggingOut(false);
    }
  }

  function navClass(target, extra = "") {
    const active = route === target || (target === "/listings" && route === "/");
    return `${active ? "active" : ""} ${extra}`.trim();
  }

  return (
    <header className="topbar">
      <nav className="nav-wrap">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark">PH</span>
          <span>Property Hub</span>
        </Link>
        <button
          className="menu-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          <Link to="/listings" className={navClass("/listings")} onClick={closeMenu}>Listings</Link>
          {canManageListings(user) && (
            <Link to="/new" className={navClass("/new")} onClick={closeMenu}>Add Listing</Link>
          )}
          {(user?.isStaff || user?.isSuperuser) && <a href="/admin/">Admin</a>}
          {user ? (
            <>
              <span className="nav-user" title={user.fullName}>{user.fullName}</span>
              <button className="logout-button" onClick={logout} disabled={loggingOut}>
                {loggingOut ? "…" : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={navClass("/login")} onClick={closeMenu}>Login</Link>
              <Link to="/register" className={navClass("/register", "nav-cta")} onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

/* ============================================================
   CATEGORY TAB BAR
   ============================================================ */
function CategoryTabBar({ active, onChange }) {
  return (
    <div className="category-bar" role="tablist" aria-label="Browse by category">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          role="tab"
          aria-selected={active === cat.key}
          className={`cat-tab ${active === cat.key ? "active" : ""}`}
          style={{ "--cat-color": cat.color }}
          onClick={() => onChange(active === cat.key ? "" : cat.key)}
        >
          <span className="cat-icon">{cat.icon}</span>
          <span className="cat-label">{cat.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   LISTINGS PAGE
   ============================================================ */
function ListingsPage() {
  const { user } = useContext(AppContext);
  const [data, setData] = useState({ properties: [] });
  const [filters, setFilters] = useState({
    q: "", category: "", subcategory: "", listingType: "", status: "", condition: "",
  });
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
    const controller = new AbortController();
    setLoading(true);
    api.request(`/api/listings/properties/?${params}`, { signal: controller.signal })
      .then(setData)
      .catch((err) => { if (err.name !== "AbortError") console.error(err); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters]);

  const total       = data.properties.length;
  const available   = data.properties.filter((p) => p.status === "available").length;
  const forSale     = data.properties.filter((p) => p.listingType === "sale").length;
  const forRent     = data.properties.filter((p) => p.listingType === "rent").length;
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const visible     = sortProperties(data.properties, sort);

  const updateFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const resetFilters = () => setFilters({ q: "", category: "", subcategory: "", listingType: "", status: "", condition: "" });

  // When category changes, reset subcategory
  function setCategory(val) {
    setFilters((f) => ({ ...f, category: val, subcategory: "" }));
  }

  const subcategoryChoices = filters.category ? (SUBCATEGORY_MAP[filters.category] || []) : [];
  const activeCatMeta = CATEGORIES.find((c) => c.key === filters.category);

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero browse-hero" aria-label="Property Hub hero">
        <div className="hero-stripe" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">Kenya's all-in-one marketplace</p>
          <h1>Buy, sell &amp; rent<br /><em>anything</em> in Kenya.</h1>
          <p>
            Property, vehicles, electronics, furniture, clothing and more —
            all in one place with verified sellers and a direct messaging flow.
          </p>
          <div className="hero-actions">
            <a href="#listings" className="button primary">Browse Listings</a>
            {canManageListings(user) && (
              <Link to="/new" className="button light">Add Listing</Link>
            )}
          </div>
        </div>
        <div className="hero-panel" aria-label="Listing summary">
          <div>
            <span>{loading ? "—" : total}</span>
            <small>Matching listings</small>
          </div>
          <div>
            <span>{loading ? "—" : available}</span>
            <small>Available now</small>
          </div>
          <div>
            <span>{activeFilters}</span>
            <small>Active filters</small>
          </div>
        </div>
      </section>

      {/* ── Category Tabs ── */}
      <CategoryTabBar active={filters.category} onChange={setCategory} />

      {/* ── Section header ── */}
      <section className="listings-head" id="listings">
        <div>
          <p className="eyebrow">{activeCatMeta ? activeCatMeta.label : "All categories"}</p>
          <h2>Browse listings</h2>
        </div>
        <div className="browse-summary" aria-label="Listing summary">
          <span>{loading ? "Loading…" : `${total} result${total === 1 ? "" : "s"}`}</span>
          <span>{forSale} for sale</span>
          <span>{forRent} for rent</span>
        </div>
      </section>

      {/* ── Quick Tabs + Sort ── */}
      <section className="browse-controls" aria-label="Browse controls">
        <div className="quick-tabs" role="group" aria-label="Listing type">
          {[["", "All"], ["sale", "For sale"], ["rent", "For rent"], ["lease", "Lease"], ["exchange", "Exchange"]].map(([val, label]) => (
            <button
              key={val}
              className={filters.listingType === val ? "active" : ""}
              onClick={() => updateFilter("listingType", val)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="sort-control">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="priceLow">Price low → high</option>
            <option value="priceHigh">Price high → low</option>
          </select>
        </label>
      </section>

      {/* ── Filters ── */}
      <section className="toolbar" aria-label="Filter listings">
        <label className="search-field">
          <span>Search</span>
          <input
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
            placeholder="Search by title, city, brand…"
          />
        </label>

        {subcategoryChoices.length > 0 && (
          <div className="filter-field">
            <span>Type</span>
            <Select label="Any type" value={filters.subcategory} choices={subcategoryChoices}
              onChange={(v) => updateFilter("subcategory", v)} />
          </div>
        )}

        <div className="filter-field">
          <span>Listing</span>
          <Select label="Any listing" value={filters.listingType} choices={LISTING_TYPE_CHOICES}
            onChange={(v) => updateFilter("listingType", v)} />
        </div>

        <div className="filter-field">
          <span>Condition</span>
          <Select label="Any condition" value={filters.condition} choices={CONDITION_CHOICES}
            onChange={(v) => updateFilter("condition", v)} />
        </div>

        <div className="filter-field">
          <span>Status</span>
          <Select label="Any status" value={filters.status} choices={STATUS_CHOICES}
            onChange={(v) => updateFilter("status", v)} />
        </div>

        {activeFilters > 0 && (
          <button className="filter-reset" onClick={resetFilters} aria-label="Clear all filters">
            Clear {activeFilters > 1 ? `${activeFilters} filters` : "filter"}
          </button>
        )}
      </section>

      {loading
        ? <SkeletonGrid count={6} />
        : <PropertyGrid properties={visible} user={user} />}
    </>
  );
}

/* ── Skeleton loaders ── */
function SkeletonGrid({ count = 6 }) {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-label="Loading listings">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton-line short" />
            <div className="skeleton-line price" />
            <div className="skeleton-line full" />
            <div className="skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Sort ── */
function sortProperties(properties, sort) {
  const sorted = [...properties];
  if (sort === "priceLow") sorted.sort((a, b) => a.price - b.price);
  else if (sort === "priceHigh") sorted.sort((a, b) => b.price - a.price);
  else sorted.sort((a, b) => new Date(b.listedDate) - new Date(a.listedDate));
  return sorted;
}

/* ── Custom Select ── */
function Select({ label, value, choices = [], onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = normalizeChoices(choices);
  const selected = options.find(([k]) => k === value);
  const buttonText = selected?.[1] || label;

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc   = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  return (
    <div className="custom-select" ref={ref}>
      <button type="button" className={open ? "open" : ""}
        aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{buttonText}</span>
      </button>
      {open && (
        <div className="select-menu" role="listbox" aria-label={label}>
          {label && (
            <button type="button" role="option" aria-selected={!value}
              className={!value ? "selected" : ""} onClick={() => { onChange(""); setOpen(false); }}>
              {label}
            </button>
          )}
          {options.map(([k, text]) => (
            <button type="button" key={k} role="option" aria-selected={value === k}
              className={value === k ? "selected" : ""} onClick={() => { onChange(k); setOpen(false); }}>
              {text}
            </button>
          ))}
          {!options.length && <span className="select-empty">No options</span>}
        </div>
      )}
    </div>
  );
}

function normalizeChoices(choices) {
  if (Array.isArray(choices)) {
    return choices.map((c) => {
      if (Array.isArray(c)) return [String(c[0]), c[1]];
      if (c && typeof c === "object") return [String(c.value ?? c.key ?? ""), c.label ?? c.text ?? c.name ?? ""];
      return [String(c), String(c)];
    }).filter(([k, t]) => k || t);
  }
  if (choices && typeof choices === "object") {
    return Object.entries(choices).map(([k, t]) => [String(k), String(t)]);
  }
  return [];
}

/* ── Property Grid ── */
function PropertyGrid({ properties, user }) {
  if (!properties.length) {
    return <Empty title="No listings found" text="Try adjusting your filters or check back soon." />;
  }
  return (
    <section className="property-grid">
      {properties.map((p) => <PropertyCard key={p.id} property={p} user={user} />)}
    </section>
  );
}

/* ── Category badge helper ── */
function getCategoryMeta(cat) {
  return CATEGORIES.find((c) => c.key === cat) || { icon: "📦", label: cat, color: "#666" };
}

/* ── Property Card ── */
function PropertyCard({ property: p, user }) {
  const { favs, toggleFav, addToast } = useContext(AppContext);
  const canManage = user && (user.id === p.owner?.id || user.isAdmin || user.isStaff || user.isSuperuser);
  const cover = p.media?.find((m) => m.type === "image")?.url || p.image || "/static/images/default-property.jpg";
  const videoCount = p.media?.filter((m) => m.type === "video").length || 0;
  const isFav = favs.has(String(p.id));
  const catMeta = getCategoryMeta(p.category);

  // Property-specific details
  const isPropertyCat = PROPERTY_CATEGORIES.has(p.category);
  const detailCount = isPropertyCat ? [p.bedrooms, p.bathrooms, p.squareFeet].filter(Boolean).length : 0;

  function handleFav(e) {
    e.preventDefault();
    toggleFav(String(p.id));
    addToast(isFav ? "Removed from saved" : "Saved to favourites");
  }

  return (
    <article className="property-card">
      <div className="property-media">
        <img src={cover} alt={p.title} loading="lazy" />
        <span className={`pill ${p.status}`}>{p.statusLabel || p.status}</span>
        {videoCount ? <span className="media-badge">▶ {videoCount} video{videoCount !== 1 ? "s" : ""}</span> : null}
        <button
          className={`fav-btn ${isFav ? "active" : ""}`}
          onClick={handleFav}
          aria-label={isFav ? "Unsave" : "Save listing"}
          title={isFav ? "Unsave" : "Save"}
        >
          <svg viewBox="0 0 24 24" fill={isFav ? "var(--accent)" : "none"} stroke={isFav ? "var(--accent)" : "var(--ink-40)"} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        {/* Category badge */}
        <span className="cat-badge" style={{ "--cat-color": catMeta.color }} title={catMeta.label}>
          {catMeta.icon}
        </span>
      </div>
      <div className="property-body">
        <div className="card-top">
          <h2>{p.title}</h2>
          <span className="listing-kind">{p.listingTypeLabel || p.listingType}</span>
        </div>
        <p className="muted">{p.location}</p>
        <strong className="price">{money.format(p.price)}</strong>

        {/* Condition badge for non-property categories */}
        {p.condition && !isPropertyCat && (
          <span className={`condition-badge cond-${p.condition}`}>
            {CONDITION_CHOICES.find(([k]) => k === p.condition)?.[1] || p.condition}
          </span>
        )}

        {/* Property room stats */}
        {detailCount > 0 && (
          <div className="property-stats" aria-label="Property details">
            {p.bedrooms  ? <span><strong>{p.bedrooms}</strong> beds</span>  : null}
            {p.bathrooms ? <span><strong>{p.bathrooms}</strong> baths</span> : null}
            {p.squareFeet? <span><strong>{p.squareFeet}</strong> sqft</span> : null}
          </div>
        )}

        {/* Vehicle specs */}
        {VEHICLE_CATEGORIES.has(p.category) && (
          <div className="vehicle-specs">
            {p.make      && <span>{p.make}</span>}
            {p.model     && <span>{p.model}</span>}
            {p.year      && <span>{p.year}</span>}
            {p.mileage   && <span>{Number(p.mileage).toLocaleString()} km</span>}
          </div>
        )}

        <div className="property-meta">
          {p.city        && <span>{p.city}</span>}
          {p.owner?.name && <span>{p.owner.name}</span>}
        </div>
        <div className="chips">
          <span style={{ background: `${catMeta.color}18`, color: catMeta.color, borderColor: `${catMeta.color}30` }}>
            {catMeta.icon} {catMeta.label}
          </span>
          {p.subcategoryLabel && <span>{p.subcategoryLabel}</span>}
          {videoCount ? <span>Video tour</span> : null}
        </div>
        <div className="card-actions">
          <Link to={`/properties/${p.id}`} className="button primary">Details</Link>
          {canManage && <Link to={`/properties/${p.id}/edit`} className="button ghost">Edit</Link>}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   PROPERTY DETAIL
   ============================================================ */
function PropertyDetail({ propertyId }) {
  const { user, setNotice, favs, toggleFav, addToast } = useContext(AppContext);
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    api.get(`/api/listings/properties/${propertyId}/`)
      .then((d) => { setProperty(d.property); setActiveMediaIndex(0); })
      .catch((err) => setError(err.message));
  }, [propertyId]);

  if (error) return <Empty title="Could not load listing" text={error} />;
  if (!property) return <div className="loading">Loading listing…</div>;

  const canManage = user && (user.id === property.owner?.id || user.isAdmin || user.isStaff || user.isSuperuser);
  const media = property.media?.length
    ? property.media
    : [{ id: "fallback", type: "image", url: property.image || "/static/images/default-property.jpg" }];
  const activeMedia = media[activeMediaIndex] || media[0];
  const isFav = favs.has(String(property.id));
  const catMeta = getCategoryMeta(property.category);
  const isPropertyCat = PROPERTY_CATEGORIES.has(property.category);
  const isVehicleCat  = VEHICLE_CATEGORIES.has(property.category);

  async function deleteProperty() {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await api.delete(`/api/listings/properties/${property.id}/`);
      setNotice("Listing deleted.");
      navigate("/app/listings");
    } catch (err) {
      setNotice(err.message || "Delete failed.");
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: property.title, url });
    } else {
      navigator.clipboard?.writeText(url).then(() => addToast("Link copied to clipboard"));
    }
  }

  function handleFav() {
    toggleFav(String(property.id));
    addToast(isFav ? "Removed from saved" : "Saved to favourites");
  }

  return (
    <>
      <button className="back-link" onClick={() => navigate("/app/listings")} aria-label="Back to listings">
        ← Back to listings
      </button>
      <section className="detail-layout">
        <div className="media-gallery">
          <div className="featured-media-frame">
            {activeMedia.type === "video"
              ? <video src={activeMedia.url} controls key={activeMedia.url} />
              : <img src={activeMedia.url} alt={`${property.title} photo ${activeMediaIndex + 1}`} key={activeMedia.url} />}
          </div>
          {media.length > 1 && (
            <div className="media-thumbnails" aria-label="Media thumbnails">
              {media.map((item, i) => (
                <button key={item.id} type="button"
                  className={i === activeMediaIndex ? "active" : ""}
                  onClick={() => setActiveMediaIndex(i)}
                  aria-label={`Show ${item.type} ${i + 1}`}>
                  {item.type === "video"
                    ? <video src={item.url} muted />
                    : <img src={item.url} alt="" loading="lazy" />}
                  {item.type === "video" && <span>Video</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-panel">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <span className={`pill ${property.status}`}>{property.statusLabel || property.status}</span>
              <span className="cat-chip" style={{ "--cat-color": catMeta.color }}>
                {catMeta.icon} {catMeta.label}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button onClick={handleFav} className="button ghost icon-btn" aria-label={isFav ? "Unsave" : "Save"} style={{ color: isFav ? "var(--accent)" : undefined }}>♥</button>
              <button onClick={handleShare} className="button ghost icon-btn" aria-label="Share">↗</button>
            </div>
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 400 }}>{property.title}</h1>
          <p className="price" style={{ fontSize: "2rem", letterSpacing: "-0.04em" }}>
            {money.format(property.price)}
          </p>

          {property.condition && (
            <span className={`condition-badge cond-${property.condition}`} style={{ fontSize: "0.875rem" }}>
              {CONDITION_CHOICES.find(([k]) => k === property.condition)?.[1] || property.condition}
            </span>
          )}

          <p className="muted">{property.description || "No description has been added yet."}</p>

          <dl className="details">
            <div><dt>Location</dt><dd>{property.location}</dd></div>
            <div><dt>Seller</dt><dd>{property.owner?.name}</dd></div>
            <div><dt>Category</dt><dd>{catMeta.icon} {catMeta.label}{property.subcategoryLabel ? ` › ${property.subcategoryLabel}` : ""}</dd></div>
            <div><dt>Listing</dt><dd>{property.listingTypeLabel || property.listingType}</dd></div>

            {/* Property-specific */}
            {isPropertyCat && property.bedrooms   && <div><dt>Bedrooms</dt><dd>{property.bedrooms}</dd></div>}
            {isPropertyCat && property.bathrooms  && <div><dt>Bathrooms</dt><dd>{property.bathrooms}</dd></div>}
            {isPropertyCat && property.squareFeet && <div><dt>Size</dt><dd>{property.squareFeet} sq ft</dd></div>}

            {/* Vehicle-specific */}
            {isVehicleCat  && property.make       && <div><dt>Make</dt><dd>{property.make}</dd></div>}
            {isVehicleCat  && property.model      && <div><dt>Model</dt><dd>{property.model}</dd></div>}
            {isVehicleCat  && property.year       && <div><dt>Year</dt><dd>{property.year}</dd></div>}
            {isVehicleCat  && property.mileage    && <div><dt>Mileage</dt><dd>{Number(property.mileage).toLocaleString()} km</dd></div>}
            {isVehicleCat  && property.engineSize && <div><dt>Engine</dt><dd>{property.engineSize}</dd></div>}
            {isVehicleCat  && property.transmission && <div><dt>Transmission</dt><dd>{property.transmission}</dd></div>}

            {/* Generic extras */}
            {property.brand && <div><dt>Brand</dt><dd>{property.brand}</dd></div>}
            {property.model && !isVehicleCat && <div><dt>Model</dt><dd>{property.model}</dd></div>}
            {property.color && <div><dt>Colour</dt><dd>{property.color}</dd></div>}
            {property.size  && <div><dt>Size</dt><dd>{property.size}</dd></div>}
          </dl>

          <div className="card-actions" style={{ flexWrap: "wrap" }}>
            {user && !canManage && (
              <Link to={`/properties/${property.id}/messages`} className="button primary">Contact Seller</Link>
            )}
            {canManage && (
              <Link to={`/properties/${property.id}/messages`} className="button primary">View Messages</Link>
            )}
            {canManage && <Link to={`/properties/${property.id}/edit`} className="button ghost">Edit</Link>}
            {canManage && <button className="button danger" onClick={deleteProperty}>Delete</button>}
            {!user && <Link to="/login" className="button primary">Login to Contact</Link>}
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   CHAT PAGE
   ============================================================ */
function ChatPage({ propertyId }) {
  const { user } = useContext(AppContext);
  const [property, setProperty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const socketRef = useRef(null);
  const threadRef = useRef(null);

  async function load() {
    const [propData, msgData] = await Promise.all([
      api.get(`/api/listings/properties/${propertyId}/`),
      api.get(`/api/listings/properties/${propertyId}/messages/`),
    ]);
    setProperty(propData.property);
    setMessages(msgData.messages);
  }

  useEffect(() => {
    if (!user) { navigate("/app/login"); return; }
    load().catch((err) => setError(err.message));
  }, [propertyId, user]);

  useEffect(() => {
    if (!user) return;
    let reconnectTimer = null;
    let stopped = false;

    function connect() {
      setConnectionStatus("connecting");
      const socket = new WebSocket(websocketUrl(`/ws/properties/${propertyId}/messages/`));
      socketRef.current = socket;
      socket.onopen = () => setConnectionStatus("connected");
      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "connection") setConnectionStatus(data.status || "connected");
        if (data.type === "message") {
          setMessages((cur) => mergeMessages(cur, markOwnership(data.message, user)));
        }
        if (data.type === "error") setError(data.error || "Message error.");
      };
      socket.onclose = () => {
        if (stopped) return;
        setConnectionStatus("disconnected");
        reconnectTimer = setTimeout(connect, 1800);
      };
      socket.onerror = () => setConnectionStatus("disconnected");
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [propertyId, user?.id]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "message", body: text }));
      } else {
        const created = await api.post(`/api/listings/properties/${propertyId}/messages/`, { message: text });
        setMessages((cur) => mergeMessages(cur, markOwnership(created.message, user)));
      }
      setBody("");
    } catch (err) {
      alert("Failed to send: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <Empty title="Conversation unavailable" text={error} />;
  if (!property) return <div className="loading">Loading conversation…</div>;

  return (
    <section className="chat-card">
      <div className="chat-title">
        <div>
          <p className="eyebrow">Conversation</p>
          <h1>{property.title}</h1>
        </div>
        <div className="chat-tools">
          <span className={`chat-status ${connectionStatus}`}>
            {connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "Connecting" : "Reconnecting"}
          </span>
          <Link to={`/properties/${property.id}`} className="button ghost">Listing</Link>
        </div>
      </div>
      <div className="chat-thread" ref={threadRef}>
        {messages.length
          ? messages.map((msg) => (
            <article key={msg.id} className={`bubble-row ${msg.isMine ? "mine" : ""}`}>
              <div className="bubble">
                <div className="bubble-meta">
                  <strong>{msg.isMine ? "You" : msg.sender?.name}</strong>
                  <small>{new Date(msg.timestamp).toLocaleString()}</small>
                </div>
                <p>{msg.body}</p>
                {msg.reply && <p className="legacy-reply">{msg.reply}</p>}
              </div>
            </article>
          ))
          : <Empty title="No messages yet" text="Start the conversation with a clear question." />}
      </div>
      <form className="composer" onSubmit={send}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          required
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e); }}
        />
        <button className="button primary" disabled={submitting || !body.trim()}>
          {submitting ? "…" : "Send"}
        </button>
      </form>
    </section>
  );
}

function markOwnership(msg, user) {
  return { ...msg, isMine: msg.sender?.id === user?.id };
}

function mergeMessages(messages, next) {
  const exists = messages.some((m) => m.id === next.id);
  const merged = exists
    ? messages.map((m) => m.id === next.id ? next : m)
    : [...messages, next];
  return merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/* ============================================================
   PROPERTY FORM — expanded for all categories
   ============================================================ */
const EMPTY_FORM = {
  title: "", description: "", location: "", price: "",
  address: "", city: "", state: "", zipCode: "",
  category: "property",
  subcategory: "",
  listingType: "sale",
  condition: "good",

  // Property / plots
  bedrooms: "", bathrooms: "", squareFeet: "",
  hasParking: false, hasPool: false, hasGym: false, hasGarden: false,

  // Vehicles
  make: "", model: "", year: "", mileage: "", engineSize: "", transmission: "",

  // Generic goods
  brand: "", color: "", size: "", material: "",

  status: "available",
  isFeatured: false,
};

function PropertyFormPage({ propertyId }) {
  const { setNotice, addToast } = useContext(AppContext);
  const editing = Boolean(propertyId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [mediaFiles, setMediaFiles] = useState({ image: null, images: [], videos: [] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      api.get(`/api/listings/properties/${propertyId}/`)
        .then((d) => setForm({ ...EMPTY_FORM, ...d.property }))
        .catch((err) => setError(err.message));
    }
  }, [propertyId, editing]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // When category changes reset subcategory
  function handleCategoryChange(val) {
    setForm((f) => ({ ...f, category: val, subcategory: "" }));
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = buildPayload(form, mediaFiles);
      const data = editing
        ? await (payload instanceof FormData
          ? api.post(`/api/listings/properties/${propertyId}/`, payload)
          : api.put(`/api/listings/properties/${propertyId}/`, payload))
        : await api.post("/api/listings/properties/", payload);
      setNotice(editing ? "Listing updated." : "Listing created.");
      navigate(`/app/properties/${data.property.id}`);
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <Empty title="Cannot manage listing" text={error} />;

  const isPropertyCat = PROPERTY_CATEGORIES.has(form.category);
  const isVehicleCat  = VEHICLE_CATEGORIES.has(form.category);
  const subcats       = SUBCATEGORY_MAP[form.category] || [];
  const catMeta       = getCategoryMeta(form.category);

  return (
    <section className="form-shell">
      <p className="eyebrow">{editing ? "Edit listing" : "New listing"}</p>
      <h1>{editing ? "Update listing" : "Add a listing"}</h1>
      <form onSubmit={submit} className="property-form">

        {/* ── Category ── */}
        <div className="form-field span-2">
          <span>Category</span>
          <div className="cat-picker">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`cat-pick-btn ${form.category === cat.key ? "active" : ""}`}
                style={{ "--cat-color": cat.color }}
                onClick={() => handleCategoryChange(cat.key)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Subcategory ── */}
        {subcats.length > 0 && (
          <div className="form-field">
            <span>Type / Sub-category</span>
            <Select value={form.subcategory} choices={subcats} label="Select type" onChange={(v) => set("subcategory", v)} />
          </div>
        )}

        {/* ── Core fields ── */}
        <Field label="Title" value={form.title} onChange={(v) => set("title", v)} required />
        <Field label="Price (KES)" value={form.price} onChange={(v) => set("price", v)} type="number" required />

        <label className="span-2">
          Description
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the listing in detail…" />
        </label>

        <Field label="Location / Area" value={form.location} onChange={(v) => set("location", v)} required />
        <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
        <Field label="Address" value={form.address} onChange={(v) => set("address", v)} />

        <div className="form-field">
          <span>Listing type</span>
          <Select value={form.listingType} choices={LISTING_TYPE_CHOICES} onChange={(v) => set("listingType", v)} />
        </div>

        <div className="form-field">
          <span>Condition</span>
          <Select value={form.condition} choices={CONDITION_CHOICES} onChange={(v) => set("condition", v)} />
        </div>

        <div className="form-field">
          <span>Status</span>
          <Select value={form.status} choices={STATUS_CHOICES} onChange={(v) => set("status", v)} />
        </div>

        {/* ── Property-specific fields ── */}
        {isPropertyCat && (
          <>
            <Field label="Bedrooms"    value={form.bedrooms}   onChange={(v) => set("bedrooms", v)}   type="number" />
            <Field label="Bathrooms"   value={form.bathrooms}  onChange={(v) => set("bathrooms", v)}  type="number" />
            <Field label="Size (sq ft)"value={form.squareFeet} onChange={(v) => set("squareFeet", v)} type="number" />
            <div className="checks span-2">
              {["hasParking", "hasPool", "hasGym", "hasGarden"].map((key) => (
                <label key={key}>
                  <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} />
                  {" "}{labelize(key)}
                </label>
              ))}
            </div>
          </>
        )}

        {/* ── Vehicle-specific fields ── */}
        {isVehicleCat && (
          <>
            <Field label="Make (e.g. Toyota)"     value={form.make}        onChange={(v) => set("make", v)} />
            <Field label="Model (e.g. Land Cruiser)"value={form.model}     onChange={(v) => set("model", v)} />
            <Field label="Year"                   value={form.year}        onChange={(v) => set("year", v)} type="number" />
            <Field label="Mileage (km)"           value={form.mileage}     onChange={(v) => set("mileage", v)} type="number" />
            <Field label="Engine Size (cc)"       value={form.engineSize}  onChange={(v) => set("engineSize", v)} />
            <div className="form-field">
              <span>Transmission</span>
              <Select value={form.transmission} choices={[["automatic","Automatic"],["manual","Manual"],["cvt","CVT"]]} label="Select" onChange={(v) => set("transmission", v)} />
            </div>
          </>
        )}

        {/* ── Generic goods fields ── */}
        {!isPropertyCat && (
          <>
            <Field label="Brand" value={form.brand} onChange={(v) => set("brand", v)} />
            {!isVehicleCat && <Field label="Model / Version" value={form.model} onChange={(v) => set("model", v)} />}
            <Field label="Colour" value={form.color} onChange={(v) => set("color", v)} />
            <Field label="Size / Dimensions" value={form.size} onChange={(v) => set("size", v)} />
            <Field label="Material / Fabric" value={form.material} onChange={(v) => set("material", v)} />
          </>
        )}

        {/* ── Media ── */}
        <fieldset className="media-upload span-2">
          <legend>Media</legend>
          <label>
            Cover image
            <input type="file" accept="image/*"
              onChange={(e) => setMediaFiles({ ...mediaFiles, image: e.target.files[0] || null })} />
          </label>
          <label>
            More pictures
            <input type="file" accept="image/*" multiple
              onChange={(e) => setMediaFiles({ ...mediaFiles, images: Array.from(e.target.files) })} />
          </label>
          <label>
            Videos
            <input type="file" accept="video/*" multiple
              onChange={(e) => setMediaFiles({ ...mediaFiles, videos: Array.from(e.target.files) })} />
          </label>
          {(mediaFiles.image || mediaFiles.images.length || mediaFiles.videos.length) ? (
            <div className="media-preview">
              {mediaFiles.image && <span>{mediaFiles.image.name}</span>}
              {mediaFiles.images.map((f) => <span key={f.name}>{f.name}</span>)}
              {mediaFiles.videos.map((f) => <span key={f.name}>{f.name}</span>)}
            </div>
          ) : null}
        </fieldset>

        <button className="button primary span-2" disabled={submitting}>
          {submitting ? "Saving…" : editing ? "Save Changes" : "Create Listing"}
        </button>
      </form>
    </section>
  );
}

function buildPayload(form, mediaFiles) {
  const hasFiles = mediaFiles.image || mediaFiles.images.length || mediaFiles.videos.length;
  if (!hasFiles) return form;
  const payload = new FormData();
  Object.entries(form).forEach(([k, v]) => payload.append(k, v ?? ""));
  if (mediaFiles.image) payload.append("image", mediaFiles.image);
  mediaFiles.images.forEach((f) => payload.append("images", f));
  mediaFiles.videos.forEach((f) => payload.append("videos", f));
  return payload;
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <label>
      {label}
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} />
    </label>
  );
}

function labelize(v) {
  return v.replace("has", "").replace(/[A-Z]/g, " $&").trim();
}

/* ============================================================
   AUTH
   ============================================================ */
function LoginPage() {
  return <AuthLayout initialView="login" />;
}

function RegisterPage() {
  return <AuthLayout initialView="register" />;
}

function AuthLayout({ initialView }) {
  const [activeView, setActiveView] = useState(initialView);
  const { refreshSession, addToast } = useContext(AppContext);

  useEffect(() => { setActiveView(initialView); }, [initialView]);

  function toggleView() {
    const nextView = activeView === "login" ? "register" : "login";
    setActiveView(nextView);
    navigate(`/app/${nextView}`);
  }

  async function handleLogin(email, password) {
    await api.post("/api/accounts/login/", { email, password });
    await refreshSession();
    addToast("Welcome back to Property Hub!", "success");
    const dest = sessionStorage.getItem("postLoginPath") || "/app/listings";
    sessionStorage.removeItem("postLoginPath");
    navigate(dest);
  }

  async function handleRegister(form) {
    if (form.password !== form.passwordConfirm) {
      addToast("Passwords do not match.", "error");
      return;
    }
    await api.post("/api/accounts/register/", {
      firstName: form.firstName, lastName: form.lastName,
      username: form.username, email: form.email,
      phone: form.phone, role: form.isSeller ? "seller" : "buyer",
      bio: form.bio, password: form.password, passwordConfirm: form.passwordConfirm,
    });
    await refreshSession();
    addToast("Your account is ready.", "success");
    navigate("/app/listings");
  }

  return (
    <section className="auth-layout">
      <div className="auth-frame">
        <div className={`card-bg ${activeView}`} aria-hidden="true" />

        <div className={`hero-panel hero-register ${activeView === "register" ? "active" : ""}`}>
          <p className="eyebrow">Property Hub</p>
          <h2>Hello there</h2>
          <p>Discover listings for property, vehicles, electronics and more across Kenya.</p>
          <button
            type="button"
            className="button light"
            onClick={toggleView}
            aria-label="Sign up"
          >
            SIGN UP
          </button>
        </div>

        <div className={`hero-panel hero-login ${activeView === "login" ? "active" : ""}`}>
          <p className="eyebrow">Property Hub</p>
          <h2>Welcome back</h2>
          <p>Access your listings, saved favourites and messages.</p>
          <button
            type="button"
            className="button light"
            onClick={toggleView}
            aria-label="Log in"
          >
            LOGIN
          </button>
        </div>

        <div className={`form-panel login-panel ${activeView === "login" ? "active" : ""}`}>
          <LoginForm onSubmit={handleLogin} />
        </div>

        <div className={`form-panel register-panel ${activeView === "register" ? "active" : ""}`}>
          <RegisterForm onSubmit={handleRegister} />
        </div>
      </div>
    </section>
  );
}

function SocialButtons() {
  return (
    <div className="sso" aria-label="Continue with social accounts">
      <a href="#facebook" className="sso-btn" aria-label="Continue with Facebook">f</a>
      <a href="#twitter" className="sso-btn" aria-label="Continue with Twitter">t</a>
      <a href="#linkedin" className="sso-btn" aria-label="Continue with LinkedIn">in</a>
    </div>
  );
}

function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setPending(true); setError("");
    try { await onSubmit(email, password); }
    catch (err) { setError(err.message || "Failed to log in."); }
    finally { setPending(false); }
  }

  return (
    <div className="auth-frame-card">
      <p className="eyebrow">Secure access</p>
      <h2>Sign In</h2>
      {error && <div className="form-error" role="alert">{error}</div>}
      <form onSubmit={submit} className="auth-form">
        <SocialButtons />
        <div className="or-divider">or use standard credentials</div>
        <label className="form-group">
          <span>Email address</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} required />
        </label>
        <label className="form-group">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending} required />
        </label>
        <button
          className="button primary auth-submit"
          type="submit"
          disabled={pending}
          aria-label="Log in"
        >
          {pending ? "Authenticating…" : "LOG IN"}
        </button>
      </form>
    </div>
  );
}

function RegisterForm({ onSubmit }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", username: "", email: "",
    phone: "", bio: "", password: "", passwordConfirm: "", isSeller: false,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.username || !form.email || !form.password || !form.passwordConfirm) {
      setError("Please fill all the required fields."); return;
    }
    setPending(true); setError("");
    try { await onSubmit(form); }
    catch (err) { setError(err.message || "Failed to create account."); }
    finally { setPending(false); }
  }

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="auth-frame-card">
      <p className="eyebrow">New account</p>
      <h2>Create Account</h2>
      {error && <div className="form-error" role="alert">{error}</div>}
      <form onSubmit={submit} className="auth-form auth-form-register">
        <SocialButtons />
        <div className="or-divider">or input personal details</div>
        <div className="form-grid">
          <label className="form-group"><span>First name</span><input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} disabled={pending} required /></label>
          <label className="form-group"><span>Last name</span><input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} disabled={pending} required /></label>
          <label className="form-group"><span>Username</span><input type="text" value={form.username} onChange={(e) => update("username", e.target.value)} disabled={pending} required /></label>
          <label className="form-group"><span>Email address</span><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} disabled={pending} required /></label>
          <label className="form-group"><span>Phone</span><input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} disabled={pending} /></label>
          <label className="form-group"><span>Bio</span><input type="text" value={form.bio} onChange={(e) => update("bio", e.target.value)} disabled={pending} /></label>
          <label className="form-group"><span>Password</span><input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} disabled={pending} required /></label>
          <label className="form-group"><span>Confirm password</span><input type="password" value={form.passwordConfirm} onChange={(e) => update("passwordConfirm", e.target.value)} disabled={pending} required /></label>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.isSeller} onChange={(e) => update("isSeller", e.target.checked)} disabled={pending} />
          <span>Register as a Seller</span>
        </label>
        <button
          className="button primary auth-submit"
          type="submit"
          disabled={pending}
          aria-label="Create account"
        >
          {pending ? "Creating Account…" : "SIGN UP"}
        </button>
      </form>
    </div>
  );
}

/* ── Misc ── */
function Empty({ title, text }) {
  return (
    <section className="empty" role="status">
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

function NotFound() {
  return <Empty title="Page not found" text="That route doesn't exist." />;
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
