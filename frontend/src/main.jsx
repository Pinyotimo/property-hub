import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// ── Design Tokens Map for Dynamic CSS Injections ──
const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: '✨', color: '#1a5c43' },
  { id: 'property', label: 'Property', icon: '🏡', color: '#1a5c43' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚙', color: '#c4571a' },
  { id: 'electronics', label: 'Electronics', icon: '⚡', color: '#b5842a' },
  { id: 'furniture', label: 'Furniture', icon: '🛋️', color: '#7a4f14' },
  { id: 'clothing', label: 'Clothing', icon: '👔', color: '#a02222' },
  { id: 'household', label: 'Household', icon: '🍽️', color: '#1a7a4a' },
  { id: 'plots', label: 'Plots & Land', icon: '🪵', color: '#123d2d' },
  { id: 'machinery', label: 'Machinery', icon: '⚙️', color: '#9e4214' }
];

const LISTING_FORM_CONFIG = {
  property: {
    heading: 'Post Property Listing',
    notice: 'Property listings require ownership, agency mandate, or tenancy documents before approval.',
    titleLabel: 'Property Title',
    titlePlaceholder: 'e.g. Kilimani 3-bedroom apartment with DSQ',
    priceLabel: 'Asking Price or Monthly Rent (KSh)',
    pricePlaceholder: 'e.g. 85,000 or 18,500,000',
    descriptionPlaceholder: 'Describe rooms, amenities, estate, access roads, utilities, and viewing terms...',
    offerTypes: ['For Sale', 'For Rent', 'Short Stay'],
    fields: [
      { id: 'propertyType', label: 'Property Type', type: 'select', options: ['Apartment', 'House', 'Office', 'Retail Space', 'Warehouse'] },
      { id: 'bedrooms', label: 'Bedrooms', type: 'number', placeholder: '3' },
      { id: 'bathrooms', label: 'Bathrooms', type: 'number', placeholder: '2' },
      { id: 'floorArea', label: 'Floor Area', type: 'text', placeholder: '1,200 sqft' }
    ]
  },
  vehicles: {
    heading: 'Post Vehicle Listing',
    notice: 'Vehicle listings should include logbook status, mileage, inspection condition, and import details where relevant.',
    titleLabel: 'Vehicle Title',
    titlePlaceholder: 'e.g. Toyota Prado TX-L 2021 diesel',
    priceLabel: 'Vehicle Price (KSh)',
    pricePlaceholder: 'e.g. 6,800,000',
    descriptionPlaceholder: 'Describe service history, accident record, ownership, upgrades, and viewing location...',
    offerTypes: ['For Sale', 'For Hire', 'Lease / Financing'],
    fields: [
      { id: 'make', label: 'Make', type: 'text', placeholder: 'Toyota' },
      { id: 'model', label: 'Model', type: 'text', placeholder: 'Prado TX-L' },
      { id: 'year', label: 'Year', type: 'number', placeholder: '2021' },
      { id: 'mileage', label: 'Mileage', type: 'text', placeholder: '48,000 km' },
      { id: 'fuel', label: 'Fuel', type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] },
      { id: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'] }
    ]
  },
  electronics: {
    heading: 'Post Electronics Listing',
    notice: 'Electronics listings should state warranty, accessories, battery health, and whether the item is original or refurbished.',
    titleLabel: 'Device or Appliance Name',
    titlePlaceholder: 'e.g. iPhone 15 Pro Max 256GB',
    priceLabel: 'Selling Price (KSh)',
    pricePlaceholder: 'e.g. 155,000',
    descriptionPlaceholder: 'Describe condition, storage, included accessories, warranty, and pickup or delivery terms...',
    offerTypes: ['For Sale', 'Swap Accepted', 'Repair / Service'],
    fields: [
      { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Apple' },
      { id: 'model', label: 'Model', type: 'text', placeholder: '15 Pro Max' },
      { id: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair', 'For Parts'] },
      { id: 'warranty', label: 'Warranty', type: 'select', options: ['Manufacturer Warranty', 'Shop Warranty', 'No Warranty'] }
    ]
  },
  furniture: {
    heading: 'Post Furniture Listing',
    notice: 'Furniture listings work best with clear dimensions, material notes, and delivery or assembly availability.',
    titleLabel: 'Furniture Title',
    titlePlaceholder: 'e.g. Six-seater mahogany dining set',
    priceLabel: 'Furniture Price (KSh)',
    pricePlaceholder: 'e.g. 95,000',
    descriptionPlaceholder: 'Describe material, dimensions, age, wear, finish, and transport arrangements...',
    offerTypes: ['For Sale', 'Custom Order', 'For Hire'],
    fields: [
      { id: 'furnitureType', label: 'Furniture Type', type: 'select', options: ['Sofa', 'Bed', 'Dining Set', 'Cabinet', 'Desk', 'Outdoor'] },
      { id: 'material', label: 'Material', type: 'text', placeholder: 'Mahogany, leather, fabric' },
      { id: 'dimensions', label: 'Dimensions', type: 'text', placeholder: '180cm x 90cm' },
      { id: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair'] }
    ]
  },
  clothing: {
    heading: 'Post Clothing Listing',
    notice: 'Clothing listings should include size, fit, brand authenticity, and whether alterations are available.',
    titleLabel: 'Clothing Item Title',
    titlePlaceholder: 'e.g. Men double-breasted wool suit',
    priceLabel: 'Item Price (KSh)',
    pricePlaceholder: 'e.g. 18,500',
    descriptionPlaceholder: 'Describe fit, fabric, measurements, brand, flaws, and pickup or delivery terms...',
    offerTypes: ['For Sale', 'Custom Tailoring', 'Bulk Order'],
    fields: [
      { id: 'category', label: 'Clothing Type', type: 'select', options: ['Menswear', 'Womenswear', 'Kids', 'Shoes', 'Accessories'] },
      { id: 'size', label: 'Size', type: 'text', placeholder: 'M, EU 42, UK 10' },
      { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Local designer or label' },
      { id: 'condition', label: 'Condition', type: 'select', options: ['New With Tags', 'New', 'Pre-owned', 'Vintage'] }
    ]
  },
  household: {
    heading: 'Post Household Listing',
    notice: 'Household listings should mention capacity, usage period, service status, and delivery options.',
    titleLabel: 'Household Item Title',
    titlePlaceholder: 'e.g. Samsung double-door fridge 520L',
    priceLabel: 'Item Price (KSh)',
    pricePlaceholder: 'e.g. 72,000',
    descriptionPlaceholder: 'Describe capacity, energy rating, age, condition, accessories, and transport terms...',
    offerTypes: ['For Sale', 'For Rent', 'Bundle Sale'],
    fields: [
      { id: 'itemType', label: 'Item Type', type: 'select', options: ['Appliance', 'Kitchenware', 'Decor', 'Cleaning', 'Storage'] },
      { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Samsung' },
      { id: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair'] },
      { id: 'capacity', label: 'Capacity / Size', type: 'text', placeholder: '520L, queen size, 12-piece set' }
    ]
  },
  plots: {
    heading: 'Post Plot or Land Listing',
    notice: 'Land listings require title status, parcel size, zoning, access road, and utility availability.',
    titleLabel: 'Land Listing Title',
    titlePlaceholder: 'e.g. 1/8 acre residential plot in Ruiru',
    priceLabel: 'Land Price (KSh)',
    pricePlaceholder: 'e.g. 3,200,000',
    descriptionPlaceholder: 'Describe title status, beacons, soil, access, zoning, neighborhood, and transfer process...',
    offerTypes: ['For Sale', 'Joint Venture', 'Long Lease'],
    fields: [
      { id: 'size', label: 'Parcel Size', type: 'text', placeholder: '1/8 acre' },
      { id: 'titleStatus', label: 'Title Status', type: 'select', options: ['Freehold', 'Leasehold', 'Allotment Letter', 'Subdivision in Progress'] },
      { id: 'zoning', label: 'Zoning', type: 'select', options: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'] },
      { id: 'utilities', label: 'Utilities', type: 'text', placeholder: 'Water, power, sewer nearby' }
    ]
  },
  machinery: {
    heading: 'Post Machinery Listing',
    notice: 'Machinery listings should include operating hours, power rating, service records, and installation requirements.',
    titleLabel: 'Machinery Title',
    titlePlaceholder: 'e.g. 45kW maize milling plant',
    priceLabel: 'Machinery Price (KSh)',
    pricePlaceholder: 'e.g. 3,200,000',
    descriptionPlaceholder: 'Describe output, power needs, hours used, maintenance history, warranty, and transport support...',
    offerTypes: ['For Sale', 'For Hire', 'Service Contract'],
    fields: [
      { id: 'machineType', label: 'Machine Type', type: 'text', placeholder: 'Milling plant, excavator, generator' },
      { id: 'power', label: 'Power Rating', type: 'text', placeholder: '45kW' },
      { id: 'hours', label: 'Operating Hours', type: 'text', placeholder: '1,250 hrs' },
      { id: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like New', 'Good', 'Refurbished', 'For Parts'] }
    ]
  }
};

const MOCK_LISTINGS = [
  {
    id: 1,
    title: 'The Terraces Luxury Apartment',
    category: 'property',
    kind: 'For Sale',
    price: 'KSh 42,000,000',
    location: 'Nairobi, KE',
    time: '2 hours ago',
    status: 'available',
    image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
    stats: { bed: '3 Beds', bath: '4 Baths', sqft: '3,200 sqft' },
    specs: ['Penthouse', 'Generator', 'Borehole']
  },
  {
    id: 2,
    title: 'Land Cruiser V8 Horizon Edition',
    category: 'vehicles',
    kind: 'For Sale',
    price: 'KSh 14,500,000',
    location: 'Mombasa, KE',
    time: 'Just now',
    status: 'available',
    condition: 'like_new',
    image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
    stats: { year: '2023', transmission: 'Auto', fuel: 'Diesel' },
    specs: ['Sunroof', 'Leather Seats', '4WD']
  },
  {
    id: 3,
    title: 'High-Capacity Agricultural Milling Plant',
    category: 'machinery',
    kind: 'For Sale',
    price: 'KSh 3,200,000',
    location: 'Nakuru, KE',
    time: '1 day ago',
    status: 'pending',
    condition: 'good',
    image: 'https://images.pexels.com/photos/257700/pexels-photo-257700.jpeg',
    stats: { power: '45kW', weight: '2.4T', output: '5T/hr' },
    specs: ['Warranty', 'Installation Incl.']
  }
];

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
};

const firstFormError = (errors) => {
  if (!errors) return '';
  const firstKey = Object.keys(errors)[0];
  const value = errors[firstKey];
  return Array.isArray(value) ? value[0] : String(value);
};

export default function App() {
  const [currentView, setCurrentView] = useState('browse'); // browse | detail | chat | create | auth | dashboard
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authPending, setAuthPending] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [sellers, setSellers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listingCategory, setListingCategory] = useState('property');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const listingForm = LISTING_FORM_CONFIG[listingCategory];
  const listingCategoryData = CATEGORIES.find(c => c.id === listingCategory);

  useEffect(() => {
    fetch('/api/accounts/session/', { credentials: 'include' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!data) return;
        setCsrfToken(data.csrfToken || '');
        setUser(data.user || null);
      })
      .catch(() => {});
  }, []);

  // Trigger brief shimmering skeleton loader simulation on tab switcher
  const handleCategoryChange = (id) => {
    setLoading(true);
    setSelectedCategory(id);
    setTimeout(() => setLoading(false), 380);
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const showView = (view) => {
    setCurrentView(view);
    setNavOpen(false);
  };

  const showAuth = (mode) => {
    setAuthMode(mode);
    setAuthError('');
    setAuthSuccess('');
    showView('auth');
  };

  const handleFileSelection = (event) => {
    setSelectedFiles(Array.from(event.target.files || []));
  };

  const requestJson = async (path, payload) => {
    let response;
    try {
      response = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || getCookie('csrftoken') || ''
        },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error('Could not reach the account server. Make sure Django is running.');
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        data?.error ||
        firstFormError(data?.errors) ||
        'Could not reach the account server. Make sure Django is running on the API proxy port.'
      );
    }
    return data;
  };

  const getJson = async (path) => {
    const response = await fetch(path, { credentials: 'include' });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || 'Request failed. Please try again.');
    }
    return data;
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setAuthPending(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const payload = authMode === 'login'
        ? {
            email: formData.get('email'),
            password: formData.get('password')
          }
        : {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            username: formData.get('username'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            role: formData.get('isSeller') ? 'seller' : 'buyer',
            password: formData.get('password'),
            passwordConfirm: formData.get('passwordConfirm')
          };

      const data = await requestJson(
        authMode === 'login' ? '/api/accounts/login/' : '/api/accounts/register/',
        payload
      );
      setUser(data.user || null);
      setAuthSuccess(authMode === 'login' ? 'You are logged in.' : 'Your account has been created.');
      showView('browse');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthPending(false);
    }
  };

  const handleLogout = async () => {
    setAuthPending(true);
    try {
      await requestJson('/api/accounts/logout/', {});
      setUser(null);
      setCurrentView('browse');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthPending(false);
    }
  };

  const handlePostListingClick = () => {
    if (!user) {
      showAuth('login');
      setAuthError('Please login with an approved seller account to post a listing.');
      return;
    }
    if (!user.canPostListings) {
      showView('dashboard');
      return;
    }
    showView('create');
  };

  const handleMessageSellerClick = (event) => {
    event?.stopPropagation();
    if (!user) {
      showAuth('login');
      setAuthError('Please login or create an account to message a seller.');
      return;
    }
    showView('chat');
  };

  const loadSellers = async () => {
    if (!user?.isAdmin) return;
    setDashboardError('');
    try {
      const data = await getJson('/api/accounts/sellers/');
      setSellers(data.sellers || []);
    } catch (error) {
      setDashboardError(error.message);
    }
  };

  const handleSellerApproval = async (sellerId, approved) => {
    setDashboardError('');
    try {
      const data = await requestJson(`/api/accounts/sellers/${sellerId}/approval/`, { approved });
      setSellers(prev => prev.map(seller => seller.id === sellerId ? data.seller : seller));
    } catch (error) {
      setDashboardError(error.message);
    }
  };

  const showDashboard = () => {
    showView('dashboard');
    if (user?.isAdmin) {
      loadSellers();
    }
  };

  const filteredListings = MOCK_LISTINGS.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKind = kindFilter === 'all' || item.kind.toLowerCase() === kindFilter.toLowerCase();
    return matchesCat && matchesSearch && matchesKind;
  });

  return (
    <div className="app-container">
      {/* ── Global Header Navigation ── */}
      <header className="topbar">
        <div className="nav-wrap">
          <a href="#" className="brand" onClick={(e) => { e.preventDefault(); showView('browse'); }}>
            <span className="brand-mark">PH</span>
            <span>PROPERTY HUB</span>
          </a>
          
          <button
            className={`menu-button ${navOpen ? 'open' : ''}`}
            aria-label="Toggle Menu"
            aria-expanded={navOpen}
            aria-controls="primary-navigation"
            onClick={() => setNavOpen(open => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav id="primary-navigation" className={`nav-links ${navOpen ? 'open' : ''}`}>
            <button className={currentView === 'browse' ? 'active' : ''} onClick={() => showView('browse')}>Marketplace</button>
            <button className={currentView === 'chat' ? 'active' : ''} onClick={handleMessageSellerClick}>Messages</button>
            <span className="nav-user">{user?.fullName || user?.email || 'Guest'}</span>
            {user ? (
              <>
                <button className={currentView === 'dashboard' ? 'active' : ''} onClick={showDashboard}>Dashboard</button>
                <button className="logout-button" onClick={handleLogout} disabled={authPending}>Logout</button>
              </>
            ) : (
              <>
                <button className={currentView === 'auth' && authMode === 'login' ? 'active' : ''} onClick={() => showAuth('login')}>Login</button>
                <button className="nav-auth-cta" onClick={() => showAuth('signup')}>Sign Up</button>
              </>
            )}
            {(!user || user.canPostListings || user.isSeller) && (
              <button className="nav-cta" onClick={handlePostListingClick}>
                {user?.isSeller && !user.canPostListings ? 'Seller Pending' : '+ Post Listing'}
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ── Main Canvas Viewport ── */}
      <main className="app-main">
        
        {/* VIEW 1: BROWSE MARKETPLACE */}
        {currentView === 'browse' && (
          <>
            <section className="hero browse-hero">
              <div className="hero-copy">
                <span className="eyebrow">Curated East African Trade</span>
                <h1>Discover luxury estates & <em>premium machinery</em></h1>
                <p>Experience an edited editorial collection of assets engineered for modern development and verified prestige across East Africa.</p>
                <div className="hero-actions">
                  <button className="button primary" onClick={() => handleCategoryChange('property')}>Explore Estates</button>
                  <button className="button light" onClick={() => handleCategoryChange('machinery')}>Industrial Equipment</button>
                </div>
              </div>
              <div className="hero-panel">
                <div>
                  <span>1,840+</span>
                  <small>Verified Listings</small>
                </div>
                <div>
                  <span>KSh 4.2B</span>
                  <small>Transacted Value</small>
                </div>
              </div>
              <div className="hero-stripe"></div>
            </section>

            {/* Category horizontal track slider */}
            <div className="category-bar">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  className={`cat-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  style={{ '--cat-color': cat.color }}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-label">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Filters and Controls */}
            <div className="browse-controls">
              <div className="quick-tabs">
                <button className={kindFilter === 'all' ? 'active' : ''} onClick={() => setKindFilter('all')}>All Offers</button>
                <button className={kindFilter === 'for sale' ? 'active' : ''} onClick={() => setKindFilter('for sale')}>Buy Now</button>
                <button className={kindFilter === 'for rent' ? 'active' : ''} onClick={() => setKindFilter('for rent')}>Rentals</button>
              </div>

              <div className="sort-control">
                <span>Sorted By</span>
                <select aria-label="Sort options">
                  <option>Recent Submissions</option>
                  <option>Valuation: High to Low</option>
                  <option>Valuation: Low to High</option>
                </select>
              </div>
            </div>

            {/* Search and Contextual Filters Panel */}
            <div className="toolbar">
              <label>
                <span>Search Inventory</span>
                <input 
                  type="text" 
                  placeholder="Ex. Penthouse, Milling Machine..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>

              <div className="filter-field">
                <span>Location Profile</span>
                <div className="custom-select">
                  <button className={isSelectOpen ? 'open' : ''} onClick={() => setIsSelectOpen(!isSelectOpen)}>
                    <span>All Locations</span>
                  </button>
                  {isSelectOpen && (
                    <div className="select-menu">
                      <button className="selected">All Locations</button>
                      <button>Nairobi (Metropolitan)</button>
                      <button>Mombasa Coastline</button>
                      <button>Rift Valley Region</button>
                    </div>
                  )}
                </div>
              </div>

              <label>
                <span>Minimum Valuation</span>
                <input type="number" placeholder="Min KSh" />
              </label>

              <label>
                <span>Maximum Valuation</span>
                <input type="number" placeholder="Max KSh" />
              </label>

              <button className="filter-reset" onClick={() => { setSearchQuery(''); setKindFilter('all'); setSelectedCategory('all'); }}>
                Clear Configuration
              </button>
            </div>

            {/* Content Loading & Display Grid */}
            {loading ? (
              <div className="skeleton-grid">
                {[1, 2, 3].map(n => (
                  <div key={n} className="skeleton-card">
                    <div className="skeleton-img"></div>
                    <div className="skeleton-body">
                      <div className="skeleton-line price"></div>
                      <div className="skeleton-line full"></div>
                      <div className="skeleton-line short"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">📂</span>
                <h3>No Inventory Discovered</h3>
                <p>We couldn't locate matching records matching your filter configuration.</p>
                <button className="button primary" onClick={() => handleCategoryChange('all')}>Reset Categories</button>
              </div>
            ) : (
              <div className="property-grid">
                {filteredListings.map(item => {
                  const catData = CATEGORIES.find(c => c.id === item.category);
                  return (
                    <article key={item.id} className="property-card" onClick={() => { setSelectedProduct(item); setCurrentView('detail'); }}>
                      <div className="property-media">
                        <img src={item.image} alt={item.title} />
                        <span className={`pill ${item.status}`}>{item.status}</span>
                        <div className="cat-badge" style={{ '--cat-color': catData?.color }}>
                          {catData?.icon}
                        </div>
                        <button className={`fav-btn ${favorites.includes(item.id) ? 'active' : ''}`} onClick={(e) => toggleFavorite(item.id, e)}>
                          <svg viewBox="0 0 24 24" fill={favorites.includes(item.id) ? '#c4571a' : 'none'} stroke={favorites.includes(item.id) ? '#c4571a' : 'currentColor'} strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </button>
                      </div>

                      <div className="property-body">
                        <div className="card-top">
                          <h2>{item.title}</h2>
                          <span className="listing-kind">{item.kind}</span>
                        </div>
                        <p className="price">{item.price}</p>
                        
                        {item.condition && (
                          <div>
                            <span className={`condition-badge cond-${item.condition}`}>{item.condition.replace('_', ' ')}</span>
                          </div>
                        )}

                        <div className="property-stats">
                          {Object.entries(item.stats).map(([key, value]) => (
                            <span key={key}>
                              <strong>{value.split(' ')[0]}</strong>
                              {value.split(' ')[1] || key}
                            </span>
                          ))}
                        </div>

                        <div className="property-meta">
                          <span>📍 {item.location}</span>
                          <span>🕒 {item.time}</span>
                        </div>

                        <div className="card-actions">
                          <button className="button primary">Acquire Asset</button>
                          <button className="button ghost" onClick={handleMessageSellerClick}>Inquire</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VIEW 2: PRODUCT DETAIL PAGE */}
        {currentView === 'detail' && selectedProduct && (
          <div className="detail-layout">
            <div className="media-gallery">
              <div className="featured-media-frame">
                <img src={selectedProduct.image} alt={selectedProduct.title} />
              </div>
              <div className="media-thumbnails">
                <button className="active"><img src={selectedProduct.image} alt="Thumb" /></button>
                <button><img src="https://images.pexels.com/photos/257700/pexels-photo-257700.jpeg" alt="Thumb" /></button>
              </div>
              <div className="chips">
                {selectedProduct.specs.map((spec, idx) => (
                  <span key={idx}>✓ {spec}</span>
                ))}
              </div>
            </div>

            <div className="detail-panel">
              <span className="cat-chip" style={{ '--cat-color': CATEGORIES.find(c => c.id === selectedProduct.category)?.color }}>
                {CATEGORIES.find(c => c.id === selectedProduct.category)?.icon} {selectedProduct.category.toUpperCase()}
              </span>
              <h1>{selectedProduct.title}</h1>
              <p className="price">{selectedProduct.price}</p>
              <p className="muted">Premium listing localized in {selectedProduct.location}. Registered and cataloged {selectedProduct.time}.</p>
              
              <div className="details">
                <div>
                  <dt>Listing Status</dt>
                  <dd style={{ textTransform: 'uppercase', fontWeight: 700, color: '#1a5c43' }}>{selectedProduct.status}</dd>
                </div>
                {Object.entries(selectedProduct.stats).map(([key, val]) => (
                  <div key={key}>
                    <dt style={{ textTransform: 'capitalize' }}>{key}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
              </div>

              <div className="card-actions" style={{ marginTop: '1rem' }}>
                <button className="button primary" style={{ flex: 1 }} onClick={handleMessageSellerClick}>Initiate Purchase Offer</button>
                <button className="button ghost" onClick={() => setCurrentView('browse')}>Back to Feed</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SECURE CHAT INTERFACE */}
        {currentView === 'chat' && (
          <div className="chat-card">
            <aside className="chat-sidebar">
              <div className="chat-search-wrap">
                <input type="text" placeholder="Search direct negotiations..." />
              </div>
              <div className="chat-threads">
                <div className="chat-thread-item active">
                  <div>
                    <h4 style={{ fontWeight: 600 }}>Prime Estates Ltd</h4>
                    <p className="muted" style={{ fontSize: '0.8rem' }}>Re: The Terraces Penthouse Apartment</p>
                  </div>
                </div>
                <div className="chat-thread-item">
                  <div>
                    <h4 style={{ fontWeight: 600 }}>Mombasa Automotive</h4>
                    <p className="muted" style={{ fontSize: '0.8rem' }}>Re: Land Cruiser V8 Horizon...</p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="chat-window">
              <div className="chat-header">
                <h3>Negotiation Room — Asset Ref #0412</h3>
                <span className="listing-kind">Verified Merchant</span>
              </div>
              <div className="chat-messages">
                <div className="message-bubble incoming">
                  Jambo, thank you for your interest. The Penthouse asset parameters are open for inspection tomorrow morning. Would you like us to provision a booking pass?
                </div>
                <div className="message-bubble outgoing">
                  Please proceed with provisioning the inspection pass. Confirm if the payment structure allows corporate Escrow.
                </div>
              </div>
              <div className="chat-input-bar">
                <input type="text" placeholder="Formulate message response..." />
                <button className="button primary">Transmit</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: ROLE DASHBOARD */}
        {currentView === 'dashboard' && user && (
          <div className="dashboard-shell">
            <section className="dashboard-head">
              <div>
                <span className="eyebrow">{user.isAdmin ? 'Admin Dashboard' : user.isSeller ? 'Seller Dashboard' : 'Buyer Dashboard'}</span>
                <h1>{user.isAdmin ? 'Marketplace Control' : user.isSeller ? 'Seller Workspace' : 'Buyer Workspace'}</h1>
                <p>
                  {user.isAdmin
                    ? 'Review seller requests, monitor marketplace roles, and approve publishing access.'
                    : user.isSeller
                      ? user.canPostListings
                        ? 'Your seller account is approved. You can publish listings and manage buyer conversations.'
                        : 'Your seller account request is waiting for admin approval before you can publish listings.'
                      : 'Browse listings freely, save items, and message sellers from your account.'}
                </p>
              </div>
              <span className={`role-badge ${user.isAdmin ? 'admin' : user.isSeller ? 'seller' : 'buyer'}`}>
                {user.isAdmin ? 'Admin' : user.isSeller ? user.canPostListings ? 'Approved Seller' : 'Pending Seller' : 'Buyer'}
              </span>
            </section>

            {dashboardError && <div className="form-error" role="alert">{dashboardError}</div>}

            {user.isAdmin && (
              <section className="dashboard-panel">
                <div className="panel-title-row">
                  <div>
                    <h2>Seller Requests</h2>
                    <p>Approve sellers before they can publish marketplace listings.</p>
                  </div>
                  <button className="button ghost" onClick={loadSellers}>Refresh</button>
                </div>
                <div className="seller-table">
                  {sellers.length === 0 ? (
                    <p className="muted">No seller accounts found yet.</p>
                  ) : sellers.map(seller => (
                    <article key={seller.id} className="seller-row">
                      <div>
                        <h3>{seller.fullName}</h3>
                        <p>{seller.email}</p>
                      </div>
                      <span className={`status-chip ${seller.isSellerApproved ? 'approved' : 'pending'}`}>
                        {seller.isSellerApproved ? 'Approved' : 'Pending'}
                      </span>
                      <button
                        className={`button ${seller.isSellerApproved ? 'ghost' : 'primary'}`}
                        onClick={() => handleSellerApproval(seller.id, !seller.isSellerApproved)}
                      >
                        {seller.isSellerApproved ? 'Suspend' : 'Approve'}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {user.isSeller && !user.isAdmin && (
              <section className="dashboard-panel">
                <h2>Seller Status</h2>
                <div className="dashboard-actions">
                  <button className="button primary" disabled={!user.canPostListings} onClick={() => showView('create')}>
                    Post Listing
                  </button>
                  <button className="button ghost" onClick={handleMessageSellerClick}>View Messages</button>
                </div>
                {!user.canPostListings && (
                  <p className="muted">An admin must approve your seller request before the posting page is available.</p>
                )}
              </section>
            )}

            {user.isBuyer && !user.isSeller && !user.isAdmin && (
              <section className="dashboard-panel">
                <h2>Buyer Activity</h2>
                <div className="dashboard-actions">
                  <button className="button primary" onClick={() => showView('browse')}>Browse Listings</button>
                  <button className="button ghost" onClick={handleMessageSellerClick}>Messages</button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* VIEW 5: LOGIN / SIGNUP */}
        {currentView === 'auth' && (
          <div className="auth-layout">
            <section className="auth-panel">
              <div className="auth-copy">
                <span className="eyebrow">Property Hub Account</span>
                <h1>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
                <p>
                  {authMode === 'login'
                    ? 'Access saved listings, messages, and seller tools from one secure workspace.'
                    : 'Join the marketplace to save assets, contact sellers, and publish listings across categories.'}
                </p>
                <div className="auth-switch">
                  <button
                    className={authMode === 'login' ? 'active' : ''}
                    type="button"
                    onClick={() => setAuthMode('login')}
                  >
                    Login
                  </button>
                  <button
                    className={authMode === 'signup' ? 'active' : ''}
                    type="button"
                    onClick={() => setAuthMode('signup')}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
                {authError && <div className="form-error" role="alert">{authError}</div>}
                {authSuccess && <div className="form-success" role="status">{authSuccess}</div>}

                {authMode === 'signup' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="first-name">First Name</label>
                      <input id="first-name" name="firstName" type="text" placeholder="Jane" autoComplete="given-name" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="last-name">Last Name</label>
                      <input id="last-name" name="lastName" type="text" placeholder="Otieno" autoComplete="family-name" required />
                    </div>
                  </div>
                )}

                {authMode === 'signup' && (
                  <div className="form-group">
                    <label htmlFor="auth-username">Username</label>
                    <input id="auth-username" name="username" type="text" placeholder="janeotieno" autoComplete="username" required />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="auth-email">Email Address</label>
                  <input id="auth-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
                </div>

                {authMode === 'signup' && (
                  <div className="form-group">
                    <label htmlFor="auth-phone">Phone Number</label>
                    <input id="auth-phone" name="phone" type="tel" placeholder="+254 700 000 000" autoComplete="tel" />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    name="password"
                    type="password"
                    placeholder={authMode === 'login' ? 'Enter your password' : 'Create a secure password'}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                </div>

                {authMode === 'signup' && (
                  <div className="form-group">
                    <label htmlFor="auth-password-confirm">Confirm Password</label>
                    <input id="auth-password-confirm" name="passwordConfirm" type="password" placeholder="Repeat password" autoComplete="new-password" required />
                  </div>
                )}

                <div className="auth-options">
                  <label className="checkbox-row">
                    <input name="isSeller" type="checkbox" />
                    <span>{authMode === 'login' ? 'Remember me' : 'Register as a seller'}</span>
                  </label>
                  {authMode === 'login' && <a href="#forgot-password">Forgot password?</a>}
                </div>

                <button className="button primary auth-submit" type="submit" disabled={authPending}>
                  {authPending ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
                </button>

                <p className="auth-footnote">
                  {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                    {authMode === 'login' ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              </form>
            </section>
          </div>
        )}

        {/* VIEW 6: CREATION WIZARD FORM SHELL */}
        {currentView === 'create' && user?.canPostListings && (
          <div className="form-shell listing-form-shell">
            <div className="form-title-row">
              <div>
                <span className="eyebrow">Listing Workspace</span>
                <h2>{listingForm.heading}</h2>
              </div>
              <span className="form-category-chip" style={{ '--cat-color': listingCategoryData?.color }}>
                <span>{listingCategoryData?.icon}</span>
                {listingCategoryData?.label}
              </span>
            </div>
            <div className="notice">
              <span>⚠️</span> {listingForm.notice}
            </div>

            <div className="form-group">
              <label>Select Category Segment</label>
              <div className="cat-picker">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-pick-btn ${listingCategory === cat.id ? 'selected' : ''}`}
                    style={{ '--cat-color': cat.color }}
                    onClick={() => setListingCategory(cat.id)}
                    aria-pressed={listingCategory === cat.id}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="title">{listingForm.titleLabel}</label>
              <input id="title" type="text" placeholder={listingForm.titlePlaceholder} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">{listingForm.priceLabel}</label>
                <input id="price" type="text" placeholder={listingForm.pricePlaceholder} />
              </div>
              <div className="form-group">
                <label htmlFor="kind">Offering Arrangement</label>
                <select id="kind">
                  {listingForm.offerTypes.map(type => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="category-fieldset">
              <legend>{listingCategoryData?.label} Details</legend>
              <div className="form-row">
                {listingForm.fields.map(field => (
                  <div className="form-group compact" key={field.id}>
                    <label htmlFor={field.id}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select id={field.id}>
                        {field.options.map(option => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input id={field.id} type={field.type} placeholder={field.placeholder} />
                    )}
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="form-group">
              <label htmlFor="desc">Editorial Description</label>
              <textarea id="desc" placeholder={listingForm.descriptionPlaceholder}></textarea>
            </div>

            <div className="upload-panel">
              <div>
                <span className="upload-icon">＋</span>
                <strong>Add photos or documents</strong>
                <p>
                  {selectedFiles.length > 0
                    ? selectedFiles.map(file => file.name).join(', ')
                    : 'Use clear cover photos, proof documents, and close-ups that match the selected item type.'}
                </p>
              </div>
              <label className="button ghost upload-button" htmlFor="listing-files">Choose Files</label>
              <input
                id="listing-files"
                className="file-input"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={handleFileSelection}
              />
            </div>

            <div className="card-actions" style={{ marginTop: '2rem' }}>
              <button className="button primary" onClick={() => setCurrentView('browse')}>Publish {listingCategoryData?.label} Listing</button>
              <button className="button ghost" onClick={() => setCurrentView('browse')}>Cancel Consignment</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ── Application Mounting Mount ──
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
