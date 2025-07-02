import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch product details
  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      });
    // Fetch recommendations
    fetch(`http://127.0.0.1:8000/recommendations/${id}`)
      .then(res => res.json())
      .then(data => setRecommendations(data));
  }, [id]);

  if (loading || !product) return <div>Loading...</div>;

  return (
    <div className="product-detail-page">
      <h2>{product.product_name}</h2>
      <img src={product.image_url} alt={product.product_name} style={{width: 300, height: 150, objectFit: 'cover', borderRadius: 8}} />
      <div><b>Price:</b> ${product.price}</div>
      <div><b>Rating:</b> {product.rating} ⭐</div>
      <div><b>Category:</b> {product.category}</div>
      <div><b>Subcategory:</b> {product.subcategory}</div>
      <div><b>Description:</b> {product.description}</div>
      <div><b>Manufacturer:</b> {product.manufacturer}</div>
      <div><b>In Stock:</b> {product.quantity_in_stock}</div>
      <div><b>Weight:</b> {product.weight}</div>
      <div><b>Dimensions:</b> {product.dimensions}</div>
      <div><b>Release Date:</b> {product.release_date}</div>
      <div style={{marginTop: 32}}>
        <h3>You may also like</h3>
        <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
          {recommendations.map(rec => (
            <div key={rec.product_id} style={{border: '1px solid #ccc', borderRadius: 8, padding: 8, width: 180}}>
              <img src={rec.image_url} alt={rec.product_name} style={{width: '100%', height: 80, objectFit: 'cover', borderRadius: 4}} />
              <div style={{fontWeight: 'bold'}}>{rec.product_name}</div>
              <div>Price: ${rec.price}</div>
              <div>Rating: {rec.rating} ⭐</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail; 