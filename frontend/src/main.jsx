import React, { useEffect, useState } from "react";
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
    const response = await fetch(path, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
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
  get(path) {
    return api.request(path);
  },
  post(path, body) {
    return api.request(path, { method: "POST", body: JSON.stringify(body) });
  },
  put(path, body) {
    return api.request(path, { method: "PUT", body: JSON.stringify(body) });
  },
  delete(path) {
    return api.request(path, { method: "DELETE" });
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

function App() {
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

  const context = { user: session.user, setNotice, refreshSession };

  return (
    <>
      <Nav user={session.user} refreshSession={refreshSession} setNotice={setNotice} />
      <main className="app-main">
        {notice && <div className="notice">{notice}</div>}
        {session.loading ? (
          <div className="loading">Loading Property Hub...</div>
        ) : (
          <Router route={route} context={context} />
        )}
      </main>
    </>
  );
}

function Router({ route, context }) {
  const parts = route.split("/").filter(Boolean);
  if (route === "/" || route === "/listings") return <ListingsPage {...context} />;
  if (route === "/login") return <LoginPage {...context} />;
  if (route === "/register") return <RegisterPage {...context} />;
  if (route === "/new") return <PropertyFormPage {...context} />;
  if (parts[0] === "properties" && parts[1] && parts[2] === "edit") {
    return <PropertyFormPage propertyId={parts[1]} {...context} />;
  }
  if (parts[0] === "properties" && parts[1] && parts[2] === "messages") {
    return <ChatPage propertyId={parts[1]} {...context} />;
  }
  if (parts[0] === "properties" && parts[1]) return <PropertyDetail propertyId={parts[1]} {...context} />;
  return <NotFound />;
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

function Nav({ user, refreshSession, setNotice }) {
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
          <Link to="/listings" onClick={closeMenu}>Listings</Link>
          {user && (user.isSeller || user.isAdmin) && <Link to="/new" onClick={closeMenu}>Add Property</Link>}
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
              <Link to="/login" onClick={closeMenu}>Login</Link>
              <Link to="/register" className="nav-cta" onClick={closeMenu}>Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function ListingsPage({ user }) {
  const [data, setData] = useState({ properties: [], choices: {} });
  const [filters, setFilters] = useState({ q: "", propertyType: "", listingType: "", status: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    setLoading(true);
    api.get(`/api/listings/properties/?${params}`).then(setData).finally(() => setLoading(false));
  }, [filters]);

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Homes, rentals, land, and commercial spaces</p>
          <h1>Find your next property with less friction.</h1>
          <p>Search live listings, contact owners, and keep your property conversations in one focused workspace.</p>
          <div className="hero-actions">
            <a href="#properties" className="button primary">Browse Listings</a>
            {user && (user.isSeller || user.isAdmin) && <Link to="/new" className="button light">Add Property</Link>}
          </div>
        </div>
      </section>

      <section className="toolbar" id="properties">
        <input
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          placeholder="Search title, city, location..."
        />
        <Select label="Type" value={filters.propertyType} choices={data.choices.propertyTypes} onChange={(propertyType) => setFilters({ ...filters, propertyType })} />
        <Select label="Listing" value={filters.listingType} choices={data.choices.listingTypes} onChange={(listingType) => setFilters({ ...filters, listingType })} />
        <Select label="Status" value={filters.status} choices={data.choices.statuses} onChange={(status) => setFilters({ ...filters, status })} />
      </section>

      {loading ? <div className="loading">Loading listings...</div> : <PropertyGrid properties={data.properties} user={user} />}
    </>
  );
}

function Select({ label, value, choices = [], onChange }) {
  return (
    <select value={value} aria-label={label} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {choices.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  );
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
  return (
    <article className="property-card">
      <img src={property.image || "/static/images/default-property.jpg"} alt={property.title} />
      <div className="property-body">
        <div className="card-top">
          <h2>{property.title}</h2>
          <span className={`pill ${property.status}`}>{property.statusLabel}</span>
        </div>
        <p className="muted">{property.location}</p>
        <strong className="price">{money.format(property.price)}</strong>
        <div className="chips">
          <span>{property.propertyTypeLabel}</span>
          <span>{property.listingTypeLabel}</span>
          {property.bedrooms ? <span>{property.bedrooms} bed</span> : null}
          {property.bathrooms ? <span>{property.bathrooms} bath</span> : null}
        </div>
        <div className="card-actions">
          <Link to={`/properties/${property.id}`} className="button primary">Details</Link>
          {canManage && <Link to={`/properties/${property.id}/edit`} className="button ghost">Edit</Link>}
        </div>
      </div>
    </article>
  );
}

function PropertyDetail({ propertyId, user, setNotice }) {
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get(`/api/listings/properties/${propertyId}/`).then((data) => setProperty(data.property)).catch((err) => setError(err.message));
  }, [propertyId]);

  if (error) return <Empty title="Could not load property" text={error} />;
  if (!property) return <div className="loading">Loading property...</div>;

  const canManage = user && (user.id === property.owner.id || user.isAdmin || user.isStaff || user.isSuperuser);
  async function deleteProperty() {
    if (!window.confirm("Delete this property?")) return;
    await api.delete(`/api/listings/properties/${property.id}/`);
    setNotice("Property deleted.");
    navigate("/app/listings");
  }

  return (
    <section className="detail-layout">
      <img src={property.image || "/static/images/default-property.jpg"} alt={property.title} />
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

function ChatPage({ propertyId, user }) {
  const [property, setProperty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

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
    const created = await api.post(`/api/listings/properties/${propertyId}/messages/`, { message: body });
    setMessages([...messages, created.message]);
    setBody("");
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
        <button className="button primary">Send</button>
      </form>
    </section>
  );
}

function PropertyFormPage({ propertyId, user, setNotice }) {
  const editing = Boolean(propertyId);
  const [form, setForm] = useState(emptyPropertyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/app/login");
      return;
    }
    if (!(user.isSeller || user.isAdmin)) {
      setError("Only sellers and admins can manage listings.");
      return;
    }
    if (editing) {
      api.get(`/api/listings/properties/${propertyId}/`).then((data) => setForm(fromProperty(data.property))).catch((err) => setError(err.message));
    }
  }, [propertyId, user]);

  async function submit(event) {
    event.preventDefault();
    const data = editing
      ? await api.put(`/api/listings/properties/${propertyId}/`, form)
      : await api.post("/api/listings/properties/", form);
    setNotice(editing ? "Property updated." : "Property created.");
    navigate(`/app/properties/${data.property.id}`);
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
        <label>Property Type<Select value={form.propertyType} choices={[["house", "House"], ["apartment", "Apartment"], ["land", "Land"], ["commercial", "Commercial"], ["rental", "Rental"]]} onChange={(propertyType) => setForm({ ...form, propertyType })} /></label>
        <label>Listing Type<Select value={form.listingType} choices={[["sale", "For Sale"], ["rent", "For Rent"]]} onChange={(listingType) => setForm({ ...form, listingType })} /></label>
        <Field label="Bedrooms" type="number" value={form.bedrooms} onChange={(bedrooms) => setForm({ ...form, bedrooms })} />
        <Field label="Bathrooms" type="number" value={form.bathrooms} onChange={(bathrooms) => setForm({ ...form, bathrooms })} />
        <label>Status<Select value={form.status} choices={[["available", "Available"], ["pending", "Pending"], ["sold", "Sold"], ["rented", "Rented"]]} onChange={(status) => setForm({ ...form, status })} /></label>
        <div className="checks">
          {["hasParking", "hasPool", "hasGym", "hasGarden"].map((key) => (
            <label key={key}><input type="checkbox" checked={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} /> {labelize(key)}</label>
          ))}
        </div>
        <button className="button primary span-2">{editing ? "Save Changes" : "Create Property"}</button>
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

function LoginPage({ refreshSession, setNotice }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    try {
      await api.post("/api/accounts/login/", form);
      await refreshSession();
      setNotice("Welcome back.");
      navigate("/app/listings");
    } catch (err) {
      setError(err.message);
    }
  }
  return <AuthForm title="Login" error={error} onSubmit={submit} form={form} setForm={setForm} />;
}

function RegisterPage({ refreshSession, setNotice }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", phone: "", role: "buyer", bio: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    try {
      await api.post("/api/accounts/register/", form);
      await refreshSession();
      setNotice("Your account is ready.");
      navigate("/app/listings");
    } catch (err) {
      setError(err.message);
    }
  }
  return <AuthForm title="Create Account" register error={error} onSubmit={submit} form={form} setForm={setForm} />;
}

function AuthForm({ title, register = false, error, onSubmit, form, setForm }) {
  return (
    <section className="auth-card">
      <p className="eyebrow">Property Hub</p>
      <h1>{title}</h1>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={onSubmit}>
        {register && <Field label="First Name" value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })} />}
        {register && <Field label="Last Name" value={form.lastName} onChange={(lastName) => setForm({ ...form, lastName })} />}
        {register && <Field label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} />}
        <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        {register && <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />}
        {register && <label>Role<Select value={form.role} choices={[["buyer", "Buyer"], ["seller", "Seller"]]} onChange={(role) => setForm({ ...form, role })} /></label>}
        <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        {register && <Field label="Confirm Password" type="password" value={form.passwordConfirm} onChange={(passwordConfirm) => setForm({ ...form, passwordConfirm })} />}
        <button className="button primary">{title}</button>
      </form>
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

createRoot(document.getElementById("root")).render(<App />);
