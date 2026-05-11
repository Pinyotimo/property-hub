import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const money = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

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
  get(path, options) {
    return api.request(path, options);
  },
  post(path, body, options) {
    return api.request(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body), ...options });
  },
  put(path, body, options) {
    return api.request(path, { method: "PUT", body: body instanceof FormData ? body : JSON.stringify(body), ...options });
  },
  delete(path, options) {
    return api.request(path, { method: "DELETE", ...options });
  },
};

function firstError(errors) {
  if (!errors) return "";
  const field = Object.keys(errors)[0];
  const value = errors[field];
  return Array.isArray(value) ? value[0] : String(value);
}

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
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

const AppContext = createContext(null);

function canManageListings(user) {
  return Boolean(user && (user.isSeller || user.isAdmin || user.role === "seller" || user.role === "admin"));
}

export default function App() {
  const route = useRoute();
  const [session, setSession] = useState({ user: null, loading: true });
  const [notice, setNotice] = useState("");

  async function refreshSession() {
    const data = await api.get("/api/accounts/session/");
    api.csrfToken = data.csrfToken;
    setSession({ user: data.user, loading: false });
  }

  useEffect(() => {
    refreshSession().catch(() => setSession({ user: null, loading: false }));
  }, []);

  const contextValue = { user: session.user, setNotice, refreshSession };

  return (
    <AppContext.Provider value={contextValue}>
      <Nav />
      <main className="app-main">
        {notice && <div className="notice">{notice}</div>}
        {session.loading ? (
          <div className="loading">Loading Property Hub...</div>
        ) : (
          <Router route={route} />
        )}
      </main>
    </AppContext.Provider>
  );
}

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

  if (!user) {
    return <div className="loading">Checking your session...</div>;
  }

  return children;
}

function RequireSeller({ children }) {
  const { user } = useContext(AppContext);

  if (!user) {
    return <RequireAuth>{children}</RequireAuth>;
  }

  if (!canManageListings(user)) {
    return <Empty title="Seller access required" text="Use a seller or admin account to add and manage property listings." />;
  }

  return children;
}

function Link({ to, className = "", children, onClick }) {
  return (
    <a
      href={`/app${to}`}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        onClick?.();
        navigate(`/app${to}`);
      }}
    >
      {children}
    </a>
  );
}

function Nav() {
  const { user, refreshSession, setNotice } = useContext(AppContext);
  const route = useRoute();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await api.post("/api/accounts/logout/", {});
      await refreshSession();
      setNotice("You have been logged out.");
      closeMenu();
      navigate("/app/");
    } catch (error) {
      setNotice(error.message || "Logout failed. Refresh the page and try again.");
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
        <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          <Link to="/listings" className={navClass("/listings")} onClick={closeMenu}>Listings</Link>
          {canManageListings(user) && <Link to="/new" className={navClass("/new")} onClick={closeMenu}>Add Property</Link>}
          {user?.isStaff || user?.isSuperuser ? <a href="/admin/">Admin</a> : null}
          {user ? (
            <>
              <span className="nav-user">{user.fullName}</span>
              <button className="logout-button" onClick={logout} disabled={loggingOut}>
                {loggingOut ? "Logging out..." : "Logout"}
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

function ListingsPage() {
  const { user } = useContext(AppContext);
  const [data, setData] = useState({ properties: [], choices: {} });
  const [filters, setFilters] = useState({ q: "", propertyType: "", listingType: "", status: "" });
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  // Hardcoded filter choices for immediate dropdown functionality
  const propertyTypeChoices = [
    ['house', 'House'],
    ['apartment', 'Apartment'],
    ['land', 'Land'],
    ['commercial', 'Commercial'],
    ['rental', 'Rental'],
  ];
  const listingTypeChoices = [
    ['sale', 'For Sale'],
    ['rent', 'For Rent'],
  ];
  const statusChoices = [
    ['available', 'Available'],
    ['sold', 'Sold'],
    ['rented', 'Rented'],
    ['pending', 'Pending'],
  ];

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const controller = new AbortController();
    
    setLoading(true);
    api.request(`/api/listings/properties/?${params}`, { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Fetch error:", err);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [filters]);

  const totalListings = data.properties.length;
  const availableListings = data.properties.filter((property) => property.status === "available").length;
  const saleListings = data.properties.filter((property) => property.listingType === "sale").length;
  const rentListings = data.properties.filter((property) => property.listingType === "rent").length;
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const visibleProperties = sortProperties(data.properties, sort);

  function updateFilter(key, value) {
    setFilters({ ...filters, [key]: value });
  }

  function resetFilters() {
    setFilters({ q: "", propertyType: "", listingType: "", status: "" });
  }

  return (
    <>
      <section className="hero browse-hero">
        <div className="hero-copy">
          <p className="eyebrow">Homes, rentals, land, and commercial spaces</p>
          <h1>Browse properties with the important details up front.</h1>
          <p>Filter by type, price signal, location, and availability, then open any listing for the full gallery and contact flow.</p>
          <div className="hero-actions">
            <a href="#properties" className="button primary">Browse Listings</a>
            {canManageListings(user) && <Link to="/new" className="button light">Add Property</Link>}
          </div>
        </div>
        <div className="hero-panel" aria-label="Listing summary">
          <div>
            <span>{loading ? "..." : totalListings}</span>
            <small>Matching listings</small>
          </div>
          <div>
            <span>{loading ? "..." : availableListings}</span>
            <small>Available now</small>
          </div>
          <div>
            <span>{activeFilters}</span>
            <small>Active filters</small>
          </div>
        </div>
      </section>

      <section className="listings-head" id="properties">
        <div>
          <p className="eyebrow">Live marketplace</p>
          <h2>Browse listings</h2>
        </div>
        <div className="browse-summary" aria-label="Listing summary">
          <span>{loading ? "Loading" : `${totalListings} result${totalListings === 1 ? "" : "s"}`}</span>
          <span>{saleListings} for sale</span>
          <span>{rentListings} for rent</span>
        </div>
      </section>

      <section className="browse-controls" aria-label="Browse controls">
        <div className="quick-tabs" aria-label="Listing type shortcuts">
          <button className={!filters.listingType ? "active" : ""} onClick={() => updateFilter("listingType", "")}>All</button>
          <button className={filters.listingType === "sale" ? "active" : ""} onClick={() => updateFilter("listingType", "sale")}>For sale</button>
          <button className={filters.listingType === "rent" ? "active" : ""} onClick={() => updateFilter("listingType", "rent")}>For rent</button>
        </div>
        <label className="sort-control">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="priceLow">Price low to high</option>
            <option value="priceHigh">Price high to low</option>
          </select>
        </label>
      </section>

      <section className="toolbar" aria-label="Filter listings">
        <label className="search-field">
          <span>Search</span>
          <input
            value={filters.q}
            onChange={(event) => updateFilter("q", event.target.value)}
            placeholder="Title, city, or location"
          />
        </label>
        <div className="filter-field">
          <span>Property type</span>
          <Select label="Any type" value={filters.propertyType} choices={propertyTypeChoices} onChange={(propertyType) => updateFilter("propertyType", propertyType)} />
        </div>
        <div className="filter-field">
          <span>Listing</span>
          <Select label="Any listing" value={filters.listingType} choices={listingTypeChoices} onChange={(listingType) => updateFilter("listingType", listingType)} />
        </div>
        <div className="filter-field">
          <span>Status</span>
          <Select label="Any status" value={filters.status} choices={statusChoices} onChange={(status) => updateFilter("status", status)} />
        </div>
        {activeFilters ? <button className="filter-reset" onClick={resetFilters}>Clear filters</button> : null}
      </section>

      {loading ? <div className="loading">Loading listings...</div> : <PropertyGrid properties={visibleProperties} user={user} />}
    </>
  );
}

function sortProperties(properties, sort) {
  const sorted = [...properties];
  if (sort === "priceLow") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sort === "priceHigh") {
    sorted.sort((a, b) => b.price - a.price);
  } else {
    sorted.sort((a, b) => new Date(b.listedDate) - new Date(a.listedDate));
  }
  return sorted;
}

function Select({ label, value, choices = [], onChange }) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);
  const options = normalizeChoices(choices);
  const selected = options.find(([key]) => key === value);
  const buttonText = selected?.[1] || label;

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function choose(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div className="custom-select" ref={selectRef}>
      <button
        type="button"
        className={open ? "open" : ""}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{buttonText}</span>
      </button>
      {open ? (
        <div className="select-menu" role="listbox" aria-label={label}>
          {label ? (
            <button
              type="button"
              className={!value ? "selected" : ""}
              role="option"
              aria-selected={!value}
              onClick={() => choose("")}
            >
              {label}
            </button>
          ) : null}
          {options.length ? options.map(([key, text]) => (
            <button
              type="button"
              key={key}
              className={value === key ? "selected" : ""}
              role="option"
              aria-selected={value === key}
              onClick={() => choose(key)}
            >
              {text}
            </button>
          )) : (
            <span className="select-empty">No options available</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function normalizeChoices(choices) {
  if (Array.isArray(choices)) {
    return choices
      .map((choice) => {
        if (Array.isArray(choice)) return [String(choice[0]), choice[1]];
        if (choice && typeof choice === "object") return [String(choice.value ?? choice.key ?? ""), choice.label ?? choice.text ?? choice.name ?? ""];
        return [String(choice), String(choice)];
      })
      .filter(([key, text]) => key || text);
  }

  if (choices && typeof choices === "object") {
    return Object.entries(choices).map(([key, text]) => [String(key), String(text)]);
  }

  return [];
}

function PropertyGrid({ properties, user }) {
  if (!properties.length) {
    return <Empty title="No properties found" text="Try a different search or check back soon." />;
  }
  return (
    <section className="property-grid">
      {properties.map((property) => <PropertyCard key={property.id} property={property} user={user} />)}
    </section>
  );
}

function PropertyCard({ property, user }) {
  const canManage = user && (user.id === property.owner.id || user.isAdmin || user.isStaff || user.isSuperuser);
  const cover = property.media?.find((item) => item.type === "image")?.url || property.image || "/static/images/default-property.jpg";
  const videoCount = property.media?.filter((item) => item.type === "video").length || 0;
  const detailCount = [property.bedrooms, property.bathrooms, property.squareFeet].filter(Boolean).length;
  return (
    <article className="property-card">
      <div className="property-media">
        <img src={cover} alt={property.title} />
        <span className={`pill ${property.status}`}>{property.statusLabel}</span>
        {videoCount ? <span className="media-badge">{videoCount} video{videoCount === 1 ? "" : "s"}</span> : null}
      </div>
      <div className="property-body">
        <div className="card-top">
          <h2>{property.title}</h2>
          <span className="listing-kind">{property.listingTypeLabel}</span>
        </div>
        <p className="muted">{property.location}</p>
        <strong className="price">{money.format(property.price)}</strong>
        {detailCount ? (
          <div className="property-stats" aria-label="Property details">
            {property.bedrooms ? <span><strong>{property.bedrooms}</strong> beds</span> : null}
            {property.bathrooms ? <span><strong>{property.bathrooms}</strong> baths</span> : null}
            {property.squareFeet ? <span><strong>{property.squareFeet}</strong> sq ft</span> : null}
          </div>
        ) : null}
        <div className="property-meta">
          {property.city ? <span>{property.city}</span> : null}
          {property.owner?.name ? <span>{property.owner.name}</span> : null}
        </div>
        <div className="chips">
          <span>{property.propertyTypeLabel}</span>
          {videoCount ? <span>Video tour</span> : null}
        </div>
        <div className="card-actions">
          <Link to={`/properties/${property.id}`} className="button primary">Details</Link>
          {canManage && <Link to={`/properties/${property.id}/edit`} className="button ghost">Edit</Link>}
        </div>
      </div>
    </article>
  );
}

function PropertyDetail({ propertyId }) {
  const { user, setNotice } = useContext(AppContext);
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  useEffect(() => {
    api.get(`/api/listings/properties/${propertyId}/`).then((data) => {
      setProperty(data.property);
      setActiveMediaIndex(0);
    }).catch((err) => setError(err.message));
  }, [propertyId]);

  if (error) return <Empty title="Could not load property" text={error} />;
  if (!property) return <div className="loading">Loading property...</div>;

  const canManage = user && (user.id === property.owner.id || user.isAdmin || user.isStaff || user.isSuperuser);
  const media = property.media?.length ? property.media : [{ id: "fallback", type: "image", url: property.image || "/static/images/default-property.jpg" }];
  const activeMedia = media[activeMediaIndex] || media[0];
  
  async function deleteProperty() {
    if (!window.confirm("Delete this property?")) return;
    await api.delete(`/api/listings/properties/${property.id}/`);
    setNotice("Property deleted.");
    navigate("/app/listings");
  }

  return (
    <section className="detail-layout">
      <div className="media-gallery">
        <div className="featured-media-frame">
          {activeMedia.type === "video" ? (
            <video src={activeMedia.url} controls />
          ) : (
            <img src={activeMedia.url} alt={`${property.title} ${activeMediaIndex + 1}`} />
          )}
        </div>
        {media.length > 1 ? (
          <div className="media-thumbnails" aria-label="Property media">
            {media.map((item, index) => (
              <button
                key={item.id}
                className={index === activeMediaIndex ? "active" : ""}
                onClick={() => setActiveMediaIndex(index)}
                type="button"
                aria-label={`Show ${item.type} ${index + 1}`}
              >
                {item.type === "video" ? (
                  <video src={item.url} muted />
                ) : (
                  <img src={item.url} alt="" />
                )}
                {item.type === "video" ? <span>Video</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="detail-panel">
        <span className={`pill ${property.status}`}>{property.statusLabel}</span>
        <h1>{property.title}</h1>
        <p className="muted">{property.description || "No description has been added yet."}</p>
        <dl className="details">
          <div><dt>Price</dt><dd>{money.format(property.price)}</dd></div>
          <div><dt>Location</dt><dd>{property.location}</dd></div>
          <div><dt>Owner</dt><dd>{property.owner.name}</dd></div>
          <div><dt>Type</dt><dd>{property.propertyTypeLabel} {property.listingTypeLabel.toLowerCase()}</dd></div>
          {property.bedrooms ? <div><dt>Bedrooms</dt><dd>{property.bedrooms}</dd></div> : null}
          {property.bathrooms ? <div><dt>Bathrooms</dt><dd>{property.bathrooms}</dd></div> : null}
          {property.squareFeet ? <div><dt>Size</dt><dd>{property.squareFeet} sq ft</dd></div> : null}
        </dl>
        <div className="card-actions">
          {user && !canManage && <Link to={`/properties/${property.id}/messages`} className="button primary">Contact Property Team</Link>}
          {canManage && <Link to={`/properties/${property.id}/messages`} className="button primary">View Messages</Link>}
          {canManage && <Link to={`/properties/${property.id}/edit`} className="button ghost">Edit</Link>}
          {canManage && <button className="button danger" onClick={deleteProperty}>Delete</button>}
          {!user && <Link to="/login" className="button primary">Login to Contact</Link>}
        </div>
      </div>
    </section>
  );
}

function ChatPage({ propertyId }) {
  const { user } = useContext(AppContext);
  const [property, setProperty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const [propertyData, messageData] = await Promise.all([
      api.get(`/api/listings/properties/${propertyId}/`),
      api.get(`/api/listings/properties/${propertyId}/messages/`),
    ]);
    setProperty(propertyData.property);
    setMessages(messageData.messages);
  }

  useEffect(() => {
    if (!user) {
      navigate("/app/login");
      return;
    }
    load().catch((err) => setError(err.message));
  }, [propertyId, user]);

  async function send(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.post(`/api/listings/properties/${propertyId}/messages/`, { message: body });
      setMessages([...messages, created.message]);
      setBody("");
    } catch(err) {
      alert("Failed to send message: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <Empty title="Conversation unavailable" text={error} />;
  if (!property) return <div className="loading">Loading conversation...</div>;

  return (
    <section className="chat-card">
      <div className="chat-title">
        <div>
          <p className="eyebrow">Conversation</p>
          <h1>{property.title}</h1>
        </div>
        <Link to={`/properties/${property.id}`} className="button ghost">Property</Link>
      </div>
      <div className="chat-thread">
        {messages.length ? messages.map((message) => (
          <article key={message.id} className={`bubble-row ${message.isMine ? "mine" : ""}`}>
            <div className="bubble">
              <div className="bubble-meta">
                <strong>{message.isMine ? "You" : message.sender.name}</strong>
                <small>{new Date(message.timestamp).toLocaleString()}</small>
              </div>
              <p>{message.body}</p>
              {message.reply && <p className="legacy-reply">{message.reply}</p>}
            </div>
          </article>
        )) : <Empty title="No messages yet" text="Start the conversation with a clear question." />}
      </div>
      <form className="composer" onSubmit={send}>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message..." required />
        <button className="button primary" disabled={submitting}>
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}

function PropertyFormPage({ propertyId }) {
  const { user, setNotice } = useContext(AppContext);
  const editing = Boolean(propertyId);
  const [form, setForm] = useState(emptyPropertyForm);
  const [mediaFiles, setMediaFiles] = useState({ image: null, images: [], videos: [] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      api.get(`/api/listings/properties/${propertyId}/`).then((data) => setForm(fromProperty(data.property))).catch((err) => setError(err.message));
    }
  }, [propertyId, editing]);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = buildPropertyPayload(form, mediaFiles);
      const data = editing
        ? await (payload instanceof FormData
          ? api.post(`/api/listings/properties/${propertyId}/`, payload)
          : api.put(`/api/listings/properties/${propertyId}/`, payload))
        : await api.post("/api/listings/properties/", payload);
      setNotice(editing ? "Property updated." : "Property created.");
      navigate(`/app/properties/${data.property.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <Empty title="Cannot manage listing" text={error} />;

  return (
    <section className="form-shell">
      <p className="eyebrow">{editing ? "Edit listing" : "New listing"}</p>
      <h1>{editing ? "Update property" : "Add property"}</h1>
      <form onSubmit={submit} className="property-form">
        <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <Field label="Location" value={form.location} onChange={(location) => setForm({ ...form, location })} />
        <Field label="Price" type="number" value={form.price} onChange={(price) => setForm({ ...form, price })} />
        <label className="span-2">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}></textarea></label>
        <Field label="City" value={form.city} onChange={(city) => setForm({ ...form, city })} />
        <Field label="Address" value={form.address} onChange={(address) => setForm({ ...form, address })} />
        <div className="form-field"><span>Property Type</span><Select value={form.propertyType} choices={[["house", "House"], ["apartment", "Apartment"], ["land", "Land"], ["commercial", "Commercial"], ["rental", "Rental"]]} onChange={(propertyType) => setForm({ ...form, propertyType })} /></div>
        <div className="form-field"><span>Listing Type</span><Select value={form.listingType} choices={[["sale", "For Sale"], ["rent", "For Rent"]]} onChange={(listingType) => setForm({ ...form, listingType })} /></div>
        <Field label="Bedrooms" type="number" value={form.bedrooms} onChange={(bedrooms) => setForm({ ...form, bedrooms })} />
        <Field label="Bathrooms" type="number" value={form.bathrooms} onChange={(bathrooms) => setForm({ ...form, bathrooms })} />
        <Field label="Size" type="number" value={form.squareFeet} onChange={(squareFeet) => setForm({ ...form, squareFeet })} />
        <div className="form-field"><span>Status</span><Select value={form.status} choices={[["available", "Available"], ["pending", "Pending"], ["sold", "Sold"], ["rented", "Rented"]]} onChange={(status) => setForm({ ...form, status })} /></div>
        <div className="checks">
          {["hasParking", "hasPool", "hasGym", "hasGarden"].map((key) => (
            <label key={key}><input type="checkbox" checked={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} /> {labelize(key)}</label>
          ))}
        </div>
        <fieldset className="media-upload span-2">
          <legend>Property media</legend>
          <label>
            Cover image
            <input type="file" accept="image/*" onChange={(event) => setMediaFiles({ ...mediaFiles, image: event.target.files[0] || null })} />
          </label>
          <label>
            More pictures
            <input type="file" accept="image/*" multiple onChange={(event) => setMediaFiles({ ...mediaFiles, images: Array.from(event.target.files) })} />
          </label>
          <label>
            Videos
            <input type="file" accept="video/*" multiple onChange={(event) => setMediaFiles({ ...mediaFiles, videos: Array.from(event.target.files) })} />
          </label>
          <div className="media-preview">
            {mediaFiles.image ? <span>{mediaFiles.image.name}</span> : null}
            {mediaFiles.images.map((file) => <span key={`image-${file.name}`}>{file.name}</span>)}
            {mediaFiles.videos.map((file) => <span key={`video-${file.name}`}>{file.name}</span>)}
          </div>
        </fieldset>
        <button className="button primary span-2" disabled={submitting}>
          {submitting ? "Saving..." : (editing ? "Save Changes" : "Create Property")}
        </button>
      </form>
    </section>
  );
}

const emptyPropertyForm = {
  title: "",
  description: "",
  location: "",
  price: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  propertyType: "house",
  listingType: "sale",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
  hasParking: false,
  hasPool: false,
  hasGym: false,
  hasGarden: false,
  status: "available",
  isFeatured: false,
};

function fromProperty(property) {
  return { ...emptyPropertyForm, ...property };
}

function buildPropertyPayload(form, mediaFiles) {
  const hasFiles = mediaFiles.image || mediaFiles.images.length || mediaFiles.videos.length;
  if (!hasFiles) return form;

  const payload = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    payload.append(key, value ?? "");
  });
  if (mediaFiles.image) {
    payload.append("image", mediaFiles.image);
  }
  mediaFiles.images.forEach((file) => payload.append("images", file));
  mediaFiles.videos.forEach((file) => payload.append("videos", file));
  return payload;
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label>
      {label}
      <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={["Title", "Location", "Price"].includes(label)} />
    </label>
  );
}

function labelize(value) {
  return value.replace("has", "").replace(/[A-Z]/g, " $&").trim();
}

function LoginPage() {
  const { refreshSession, setNotice } = useContext(AppContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/accounts/login/", form);
      await refreshSession();
      setNotice("Welcome back.");
      const destination = sessionStorage.getItem("postLoginPath") || "/app/listings";
      sessionStorage.removeItem("postLoginPath");
      navigate(destination);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }
  return <AuthForm title="Login" error={error} onSubmit={submit} form={form} setForm={setForm} submitting={submitting} />;
}

function RegisterPage() {
  const { refreshSession, setNotice } = useContext(AppContext);
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", phone: "", role: "buyer", bio: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post("/api/accounts/register/", form);
      await refreshSession();
      setNotice("Your account is ready.");
      navigate("/app/listings");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }
  return <AuthForm title="Create Account" register error={error} onSubmit={submit} form={form} setForm={setForm} submitting={submitting} />;
}

function AuthForm({ title, register = false, error, onSubmit, form, setForm, submitting }) {
  return (
    <section className={`auth-shell ${register ? "register" : ""}`}>
      <aside className="auth-aside">
        <p className="eyebrow">Property Hub</p>
        <h1>{register ? "Create your property workspace." : "Welcome back."}</h1>
        <p>{register ? "Save listings, reach property owners, and publish homes from one clean dashboard." : "Sign in to continue browsing, messaging owners, and managing your listings."}</p>
      </aside>
      <div className="auth-card">
        <p className="eyebrow">{register ? "New account" : "Secure access"}</p>
        <h2>{title}</h2>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={onSubmit}>
          {register && <Field label="First Name" value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })} />}
          {register && <Field label="Last Name" value={form.lastName} onChange={(lastName) => setForm({ ...form, lastName })} />}
          {register && <Field label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} />}
          <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          {register && <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />}
          {register && <div className="form-field"><span>Role</span><Select value={form.role} choices={[["buyer", "Buyer"], ["seller", "Seller"]]} onChange={(role) => setForm({ ...form, role })} /></div>}
          <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
          {register && <Field label="Confirm Password" type="password" value={form.passwordConfirm} onChange={(passwordConfirm) => setForm({ ...form, passwordConfirm })} />}
          <button className="button primary" disabled={submitting}>
            {submitting ? "Processing..." : title}
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Already have an account?" : "New to Property Hub?"}{" "}
          <Link to={register ? "/login" : "/register"}>{register ? "Login" : "Register"}</Link>
        </p>
      </div>
    </section>
  );
}

function Empty({ title, text }) {
  return (
    <section className="empty">
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

function NotFound() {
  return <Empty title="Page not found" text="That React route does not exist yet." />;
}

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(<App />);
}
