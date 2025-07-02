import json
import logging
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, Query, Body
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import models, schemas, auth, database
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from datetime import datetime
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for all origins (development only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database.Base.metadata.create_all(bind=database.engine)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load products from JSON file at startup
PRODUCTS_FILE = Path(__file__).parent / "products.json"
with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
    products_data = json.load(f)
logger.info(f"Loaded {len(products_data)} products from JSON.")

# Helper to get all products as list of Product
all_products = [schemas.Product(**prod) for prod in products_data]

# --- Content-Based Recommendation System ---
# Prepare the feature matrix for all products at startup

def build_feature_matrix(products):
    # Combine relevant features into a single string for each product
    texts = [
        f"{p.description} {p.category} {p.subcategory} {p.rating}" for p in products
    ]
    return texts

# Vectorize product features
feature_texts = build_feature_matrix(all_products)
vectorizer = TfidfVectorizer(stop_words='english')
feature_matrix = vectorizer.fit_transform(feature_texts)
logger.info("TF-IDF feature matrix built for product recommendations.")

@app.post('/register', response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail='Username already registered')
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post('/login', response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect username or password')
    access_token = auth.create_access_token(data={"sub": user.username, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/products/", response_model=schemas.ProductList)
def get_products(
    category: str = Query(None, description="Filter by category"),
    search: str = Query(None, description="Search by product name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Products per page")
):
    """
    Get all products, with optional filtering by category, search by name, and pagination.
    """
    logger.info(f"Fetching products: category={category}, search={search}, page={page}, page_size={page_size}")
    filtered = all_products
    # Filter by category if provided
    if category:
        filtered = [p for p in filtered if p.category.lower() == category.lower()]
    # Search by name if provided
    if search:
        filtered = [p for p in filtered if search.lower() in p.product_name.lower()]
    total = len(filtered)
    # Pagination
    start = (page - 1) * page_size
    end = start + page_size
    paginated = filtered[start:end]
    logger.info(f"Returning {len(paginated)} products out of {total} total.")
    return schemas.ProductList(total=total, page=page, page_size=page_size, products=paginated)

@app.get("/products/{product_id}", response_model=schemas.Product)
def get_product(product_id: int):
    """
    Get full details of a single product by ID.
    """
    logger.info(f"Fetching product with id={product_id}")
    for prod in all_products:
        if prod.product_id == product_id:
            return prod
    logger.warning(f"Product with id={product_id} not found.")
    return JSONResponse(status_code=404, content={"detail": "Product not found"})

@app.get("/recommendations/{product_id}", response_model=list[schemas.Product])
def recommend_products(product_id: int, top_k: int = 5):
    """
    Recommend similar products based on content features (description, category, subcategory, rating).
    """
    logger.info(f"Generating recommendations for product_id={product_id}")
    # Find the index of the product
    idx = next((i for i, p in enumerate(all_products) if p.product_id == product_id), None)
    if idx is None:
        logger.warning(f"Product with id={product_id} not found for recommendations.")
        return JSONResponse(status_code=404, content={"detail": "Product not found"})
    # Compute cosine similarity
    cosine_sim = cosine_similarity(feature_matrix[idx], feature_matrix).flatten()
    # Get indices of top_k most similar products (excluding itself)
    similar_indices = np.argsort(-cosine_sim)
    recommendations = []
    for i in similar_indices:
        if i != idx:
            recommendations.append(all_products[i])
        if len(recommendations) >= top_k:
            break
    logger.info(f"Returning {len(recommendations)} recommendations for product_id={product_id}")
    return recommendations

@app.post("/view", response_model=schemas.UserInteractionOut)
def track_view(interaction: schemas.UserInteractionCreate, db: Session = Depends(database.get_db)):
    """
    Track a product view by a user.
    """
    logger.info(f"User {interaction.user_id} viewed product {interaction.product_id}")
    new_interaction = models.UserInteraction(
        user_id=interaction.user_id,
        product_id=interaction.product_id,
        interaction_type="view"
    )
    db.add(new_interaction)
    db.commit()
    db.refresh(new_interaction)
    return new_interaction

@app.post("/like", response_model=schemas.UserInteractionOut)
def track_like(interaction: schemas.UserInteractionCreate, db: Session = Depends(database.get_db)):
    """
    Track a product like by a user.
    """
    logger.info(f"User {interaction.user_id} liked product {interaction.product_id}")
    new_interaction = models.UserInteraction(
        user_id=interaction.user_id,
        product_id=interaction.product_id,
        interaction_type="like"
    )
    db.add(new_interaction)
    db.commit()
    db.refresh(new_interaction)
    return new_interaction

@app.post("/purchase", response_model=schemas.UserInteractionOut)
def track_purchase(interaction: schemas.UserInteractionCreate, db: Session = Depends(database.get_db)):
    """
    Track a product purchase by a user.
    """
    logger.info(f"User {interaction.user_id} purchased product {interaction.product_id}")
    new_interaction = models.UserInteraction(
        user_id=interaction.user_id,
        product_id=interaction.product_id,
        interaction_type="purchase"
    )
    db.add(new_interaction)
    db.commit()
    db.refresh(new_interaction)
    return new_interaction

@app.get("/user/{user_id}/history", response_model=schemas.UserHistory)
def get_user_history(user_id: int, db: Session = Depends(database.get_db)):
    """
    Get a user's interaction history (views, likes, purchases).
    """
    logger.info(f"Fetching interaction history for user {user_id}")
    history = db.query(models.UserInteraction).filter(models.UserInteraction.user_id == user_id).order_by(models.UserInteraction.timestamp.desc()).all()
    # Convert SQLAlchemy models to Pydantic models using from_orm
    history_out = [schemas.UserInteractionOut.from_orm(h) for h in history]
    return schemas.UserHistory(user_id=user_id, history=history_out)

# --- Collaborative Filtering Recommendation System ---

@app.get("/collab-recommendations/{user_id}", response_model=list[schemas.Product])
def collaborative_recommendations(user_id: int, top_k: int = 5, db: Session = Depends(database.get_db)):
    """
    Recommend products using collaborative filtering based on user interaction data (likes, purchases).
    Optionally combine with content-based recommendations for hybrid results.
    """
    logger.info(f"Generating collaborative recommendations for user_id={user_id}")
    # Fetch all interactions
    interactions = db.query(models.UserInteraction).filter(models.UserInteraction.interaction_type.in_(["like", "purchase"])).all()
    if not interactions:
        logger.warning("No interaction data available for collaborative filtering.")
        return []
    # Build user-item matrix
    data = [(i.user_id, i.product_id, 1) for i in interactions]
    df = pd.DataFrame(data, columns=["user_id", "product_id", "value"])
    user_item_matrix = df.pivot_table(index="user_id", columns="product_id", values="value", fill_value=0)
    if user_id not in user_item_matrix.index:
        logger.warning(f"User {user_id} has no interactions for collaborative filtering.")
        return []
    # Compute cosine similarity between users
    user_sim = cosine_similarity([user_item_matrix.loc[user_id]], user_item_matrix)[0]
    similar_users = user_item_matrix.index[np.argsort(-user_sim)[1:]]  # Exclude self
    # Get products liked/purchased by similar users but not by the target user
    user_products = set(user_item_matrix.loc[user_id][user_item_matrix.loc[user_id] > 0].index)
    recommended = set()
    for sim_user in similar_users:
        sim_user_products = set(user_item_matrix.loc[sim_user][user_item_matrix.loc[sim_user] > 0].index)
        recommended.update(sim_user_products - user_products)
        if len(recommended) >= top_k:
            break
    # Get product details
    recommended_products = [p for p in all_products if p.product_id in recommended]
    # If not enough, fill with content-based
    if len(recommended_products) < top_k:
        content_recs = recommend_products(user_products.pop() if user_products else all_products[0].product_id, top_k=top_k)
        for p in content_recs:
            if p.product_id not in {prod.product_id for prod in recommended_products}:
                recommended_products.append(p)
            if len(recommended_products) >= top_k:
                break
    logger.info(f"Returning {len(recommended_products)} collaborative recommendations for user_id={user_id}")
    return recommended_products[:top_k] 