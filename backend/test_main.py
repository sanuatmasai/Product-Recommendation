import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from .main import app
from .database import Base, engine

import pytest_asyncio

@pytest.fixture(scope="module")
def test_app():
    # Setup DB
    Base.metadata.create_all(bind=engine)
    yield app
    # Teardown DB
    Base.metadata.drop_all(bind=engine)

@pytest_asyncio.fixture(scope="module")
async def async_client(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_register_and_login(async_client):
    # Register
    response = await async_client.post("/register", json={"username": "testuser", "password": "testpass"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    # Duplicate register
    response = await async_client.post("/register", json={"username": "testuser", "password": "testpass"})
    assert response.status_code == 400
    # Login
    response = await async_client.post("/login", data={"username": "testuser", "password": "testpass"})
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    # Wrong login
    response = await async_client.post("/login", data={"username": "testuser", "password": "wrongpass"})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_products_endpoints(async_client):
    # Test get all products (default pagination)
    resp = await async_client.get("/products/")
    assert resp.status_code == 200
    data = resp.json()
    assert "products" in data
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total"] >= 10
    # Test pagination
    resp2 = await async_client.get("/products/?page=2&page_size=5")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["page"] == 2
    assert data2["page_size"] == 5
    # Test filter by category
    resp3 = await async_client.get("/products/?category=Home")
    assert resp3.status_code == 200
    data3 = resp3.json()
    for prod in data3["products"]:
        assert prod["category"] == "Home"
    # Test search by name
    resp4 = await async_client.get("/products/?search=Travel")
    assert resp4.status_code == 200
    data4 = resp4.json()
    for prod in data4["products"]:
        assert "travel" in prod["product_name"].lower()
    # Test get single product
    prod_id = data["products"][0]["product_id"]
    resp5 = await async_client.get(f"/products/{prod_id}")
    assert resp5.status_code == 200
    prod_data = resp5.json()
    assert prod_data["product_id"] == prod_id
    # Test not found
    resp6 = await async_client.get("/products/9999999")
    assert resp6.status_code == 404

@pytest.mark.asyncio
async def test_recommendations_endpoint(async_client):
    # Get a valid product id
    resp = await async_client.get("/products/")
    assert resp.status_code == 200
    data = resp.json()
    prod_id = data["products"][0]["product_id"]
    # Get recommendations
    rec_resp = await async_client.get(f"/recommendations/{prod_id}")
    assert rec_resp.status_code == 200
    recs = rec_resp.json()
    assert isinstance(recs, list)
    assert len(recs) > 0
    # Not found case
    not_found_resp = await async_client.get("/recommendations/9999999")
    assert not_found_resp.status_code == 404

@pytest.mark.asyncio
async def test_user_interactions_and_history(async_client):
    # Register a new user for interaction tests
    username = "interaction_user"
    password = "interaction_pass"
    reg_resp = await async_client.post("/register", json={"username": username, "password": password})
    if reg_resp.status_code == 400:
        # User already exists, get user id from login
        login_resp = await async_client.post("/login", data={"username": username, "password": password})
        assert login_resp.status_code == 200
    else:
        assert reg_resp.status_code == 200
    # Get user id
    user_id = None
    users = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]  # Try a few ids for demo
    for uid in users:
        resp = await async_client.get(f"/user/{uid}/history")
        if resp.status_code == 200:
            user_id = uid
            break
    if not user_id:
        user_id = 1  # fallback
    # Get a product id
    prod_resp = await async_client.get("/products/")
    prod_id = prod_resp.json()["products"][0]["product_id"]
    # Test /view
    view_resp = await async_client.post("/view", json={"user_id": user_id, "product_id": prod_id, "interaction_type": "view"})
    assert view_resp.status_code == 200
    # Test /like
    like_resp = await async_client.post("/like", json={"user_id": user_id, "product_id": prod_id, "interaction_type": "like"})
    assert like_resp.status_code == 200
    # Test /purchase
    purchase_resp = await async_client.post("/purchase", json={"user_id": user_id, "product_id": prod_id, "interaction_type": "purchase"})
    assert purchase_resp.status_code == 200
    # Test /user/{user_id}/history
    history_resp = await async_client.get(f"/user/{user_id}/history")
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert "history" in history
    assert len(history["history"]) >= 3 