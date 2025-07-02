import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getUserIdFromToken() {
  // Decode JWT to get user_id (assumes sub=username, backend may need to expose user_id)
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // If backend encodes user_id, use it. Otherwise, fallback to username.
    return payload.user_id || payload.sub;
  } catch {
    return null;
  }
}

function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState({});
  const [viewLoading, setViewLoading] = useState({});
  const [likeSuccess, setLikeSuccess] = useState({});
  const [viewSuccess, setViewSuccess] = useState({});
  const [purchaseLoading, setPurchaseLoading] = useState({});
  const [purchaseSuccess, setPurchaseSuccess] = useState({});
  const navigate = useNavigate();
  const userId = getUserIdFromToken();

  // Fetch products from backend
  useEffect(() => {
    let url = 'http://127.0.0.1:8000/products/?page_size=100';
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        setCategories([...new Set(data.products.map(p => p.category))]);
        setLoading(false);
      });
  }, [category, search]);

  // Handle Like
  const handleLike = async (productId) => {
    if (!userId) { alert('Login required'); return; }
    setLikeLoading(l => ({ ...l, [productId]: true }));
    setLikeSuccess(s => ({ ...s, [productId]: false }));
    try {
      await fetch('http://127.0.0.1:8000/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: userId, product_id: productId })
      });
      setLikeSuccess(s => ({ ...s, [productId]: true }));
    } catch {}
    setLikeLoading(l => ({ ...l, [productId]: false }));
    setTimeout(() => setLikeSuccess(s => ({ ...s, [productId]: false })), 1200);
  };

  // Handle View
  const handleView = async (productId) => {
    if (!userId) { alert('Login required'); return; }
    setViewLoading(l => ({ ...l, [productId]: true }));
    setViewSuccess(s => ({ ...s, [productId]: false }));
    try {
      await fetch('http://127.0.0.1:8000/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: userId, product_id: productId })
      });
      setViewSuccess(s => ({ ...s, [productId]: true }));
    } catch {}
    setViewLoading(l => ({ ...l, [productId]: false }));
    setTimeout(() => setViewSuccess(s => ({ ...s, [productId]: false })), 1200);
  };

  // Handle Purchase
  const handlePurchase = async (productId) => {
    if (!userId) { alert('Login required'); return; }
    setPurchaseLoading(l => ({ ...l, [productId]: true }));
    setPurchaseSuccess(s => ({ ...s, [productId]: false }));
    try {
      await fetch('http://127.0.0.1:8000/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ user_id: userId, product_id: productId })
      });
      setPurchaseSuccess(s => ({ ...s, [productId]: true }));
    } catch {}
    setPurchaseLoading(l => ({ ...l, [productId]: false }));
    setTimeout(() => setPurchaseSuccess(s => ({ ...s, [productId]: false })), 1200);
  };

  return (
    <div className="catalog-page">
      <h2>Product Catalog</h2>
      <div style={{marginBottom: 16}}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{marginRight: 8}}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="spinner" style={{textAlign:'center',margin:40}}>
          <div className="lds-dual-ring"></div>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24}}>
          {products.map(product => (
            <div key={product.product_id} className="product-card" style={{border: '1px solid #ccc', borderRadius: 12, padding: 16, cursor: 'pointer', background:'#fafbff', boxShadow:'0 2px 8px rgba(25,118,210,0.04)'}}>
              <img src={product.image_url} alt={product.product_name} style={{width: '100%', height: 120, objectFit: 'cover', borderRadius: 6}} onClick={() => navigate(`/products/${product.product_id}`)} />
              <h3 style={{fontSize: 20, margin: '10px 0', color:'#1976d2'}}>{product.product_name}</h3>
              <div>Price: <b>${product.price}</b></div>
              <div>Rating: {product.rating} ⭐</div>
              <div style={{display:'flex', gap:8, marginTop:10}}>
                <button style={{flex:1, background:'#ff9800'}} onClick={() => handleView(product.product_id)} disabled={viewLoading[product.product_id]}>{viewLoading[product.product_id] ? '...' : 'View'}</button>
                <button style={{flex:1, background:'#e91e63'}} onClick={() => handleLike(product.product_id)} disabled={likeLoading[product.product_id]}>{likeLoading[product.product_id] ? '...' : 'Like'}</button>
                <button style={{flex:1, background:'#4caf50'}} onClick={() => handlePurchase(product.product_id)} disabled={purchaseLoading[product.product_id]}> {purchaseLoading[product.product_id] ? '...' : 'Purchase'}</button>
              </div>
              <div style={{height:18}}>
                {likeSuccess[product.product_id] && <span style={{color:'#e91e63'}}>Liked!</span>}
                {viewSuccess[product.product_id] && <span style={{color:'#ff9800'}}>Viewed!</span>}
                {purchaseSuccess[product.product_id] && <span style={{color:'#4caf50'}}>Purchased!</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Spinner CSS */}
      <style>{`.lds-dual-ring {display: inline-block;width: 48px;height: 48px;}
        .lds-dual-ring:after {content: " ";display: block;width: 32px;height: 32px;margin: 8px;border-radius: 50%;border: 4px solid #1976d2;border-color: #1976d2 transparent #1976d2 transparent;animation: lds-dual-ring 1.2s linear infinite;}
        @keyframes lds-dual-ring {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}
      `}</style>
    </div>
  );
}

export default ProductCatalog; 