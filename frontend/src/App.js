import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProductCatalog from './ProductCatalog';
import ProductDetail from './ProductDetail';
import MyHistoryPage from './MyHistoryPage';

function LandingPage() {
  return (
    <div className="catalog-page" style={{textAlign:'center'}}>
      <h1 style={{fontWeight:700, fontSize:40, color:'#1976d2'}}>Welcome to Product Recommender</h1>
      <p style={{fontSize:20, color:'#555'}}>Discover, like, view, and purchase products. Get recommendations tailored for you!</p>
      <div style={{marginTop:32}}>
        <Link to="/login"><button style={{margin:8}}>Login</button></Link>
        <Link to="/register"><button style={{margin:8}}>Register</button></Link>
        <Link to="/products"><button style={{margin:8}}>Browse Products</button></Link>
      </div>
    </div>
  );
}

function NavBar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  return (
    <nav style={{display:'flex',gap:16,alignItems:'center',padding:'12px 32px',background:'#1976d2',color:'#fff',marginBottom:24, borderRadius:'0 0 16px 16px', boxShadow:'0 2px 8px rgba(25,118,210,0.12)'}}>
      <Link to="/" style={{color:'#fff',fontWeight:'bold',fontSize:22,textDecoration:'none',letterSpacing:1}}>Home</Link>
      <Link to="/products" style={{color:'#fff',textDecoration:'none',fontSize:18}}>Products</Link>
      <Link to="/history" style={{color:'#fff',textDecoration:'none',fontSize:18}}>My History</Link>
      <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
        <Link to="/profile" style={{color:'#fff',textDecoration:'none',fontSize:18}}><span role="img" aria-label="profile">👤</span> Profile</Link>
        {isLoggedIn ? (
          <button onClick={handleLogout} style={{background:'#fff',color:'#1976d2',fontWeight:600,padding:'6px 18px',borderRadius:6,border:'none',fontSize:16,cursor:'pointer'}}>Logout</button>
        ) : (
          <>
            <Link to="/login" style={{color:'#fff',textDecoration:'none',fontSize:18}}>Login</Link>
            <Link to="/register" style={{color:'#fff',textDecoration:'none',fontSize:18}}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductCatalog />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/history" element={<MyHistoryPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
