import React, { useEffect, useState } from 'react';

function getUserIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.sub;
  } catch {
    return null;
  }
}

function MyHistoryPage() {
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const userId = getUserIdFromToken();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`http://127.0.0.1:8000/user/${userId}/history`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(async data => {
        const hist = data.history || [];
        setHistory(hist);
        // Fetch product details for each unique product_id
        const uniqueIds = [...new Set(hist.map(h => h.product_id))];
        const prods = {};
        await Promise.all(uniqueIds.map(async id => {
          const res = await fetch(`http://127.0.0.1:8000/products/${id}`);
          if (res.ok) prods[id] = await res.json();
        }));
        setProducts(prods);
        setLoading(false);
      });
  }, [userId]);

  if (!userId) return <div className="catalog-page"><h2>My History</h2><div>Please login to view your history.</div></div>;

  return (
    <div className="catalog-page">
      <h2>My History</h2>
      {loading ? (
        <div className="spinner" style={{textAlign:'center',margin:40}}>
          <div className="lds-dual-ring"></div>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {history.length === 0 && <div>No interactions yet.</div>}
          {history.map((item, i) => {
            const prod = products[item.product_id];
            return (
              <div key={i} style={{display:'flex',alignItems:'center',border:'1px solid #ccc', borderRadius:12, padding:12, background:'#f9f9ff', boxShadow:'0 2px 8px rgba(25,118,210,0.04)'}}>
                {prod && <img src={prod.image_url} alt={prod.product_name} style={{width:60,height:60,objectFit:'cover',borderRadius:8,marginRight:16}} />}
                <div style={{flex:1}}>
                  <b style={{color:'#1976d2'}}>{prod ? prod.product_name : `Product #${item.product_id}`}</b>
                  <div style={{fontSize:14, color:'#888'}}>{item.interaction_type.toUpperCase()} at {new Date(item.timestamp).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`.lds-dual-ring {display: inline-block;width: 48px;height: 48px;}
        .lds-dual-ring:after {content: " ";display: block;width: 32px;height: 32px;margin: 8px;border-radius: 50%;border: 4px solid #1976d2;border-color: #1976d2 transparent #1976d2 transparent;animation: lds-dual-ring 1.2s linear infinite;}
        @keyframes lds-dual-ring {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}
      `}</style>
    </div>
  );
}

export default MyHistoryPage; 