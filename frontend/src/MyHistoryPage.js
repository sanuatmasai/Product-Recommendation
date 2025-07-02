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
  const [loading, setLoading] = useState(true);
  const userId = getUserIdFromToken();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`http://127.0.0.1:8000/user/${userId}/history`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
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
          {history.map((item, i) => (
            <div key={i} style={{border:'1px solid #ccc', borderRadius:8, padding:12, background:'#f9f9ff'}}>
              <b>{item.interaction_type.toUpperCase()}</b> on product #{item.product_id} at {new Date(item.timestamp).toLocaleString()}
            </div>
          ))}
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