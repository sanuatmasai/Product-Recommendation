import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProductCatalog from './ProductCatalog';
import ProductDetail from './ProductDetail';
import MyHistoryPage from './MyHistoryPage';

function LandingPage() {
  return (
    <div className="catalog-page" style={{textAlign:'center'}}>
      <h1>Welcome to Product Recommender</h1>
      <p>Discover, like, and view products. Get recommendations tailored for you!</p>
      <div style={{marginTop:32}}>
        <Link to="/login"><button style={{margin:8}}>Login</button></Link>
        <Link to="/register"><button style={{margin:8}}>Register</button></Link>
        <Link to="/products"><button style={{margin:8}}>Browse Products</button></Link>
      </div>
    </div>
  );
}

function NavBar() {
  return (
    <nav style={{display:'flex',gap:16,alignItems:'center',padding:'12px 32px',background:'#1976d2',color:'#fff',marginBottom:24}}>
      <Link to="/" style={{color:'#fff',fontWeight:'bold',fontSize:20,textDecoration:'none'}}>Home</Link>
      <Link to="/products" style={{color:'#fff',textDecoration:'none'}}>Products</Link>
      <Link to="/history" style={{color:'#fff',textDecoration:'none'}}>My History</Link>
      <Link to="/login" style={{color:'#fff',textDecoration:'none',marginLeft:'auto'}}>Login</Link>
      <Link to="/register" style={{color:'#fff',textDecoration:'none'}}>Register</Link>
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
