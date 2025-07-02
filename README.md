# Product Recommendation System

A full-stack AI-powered product recommendation platform with a FastAPI backend and React frontend.

---

## Table of Contents
- [Overview](#overview)
- [How It Works (Layman Explanation)](#how-it-works-layman-explanation)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Structure](#database-structure)
- [Authentication & Security](#authentication--security)
- [API Endpoints (with Examples)](#api-endpoints-with-examples)
  - [User Registration & Login](#user-registration--login)
  - [Product Catalog](#product-catalog)
  - [Product Details](#product-details)
  - [Recommendations](#recommendations)
  - [User Interactions (View, Like, Purchase)](#user-interactions-view-like-purchase)
  - [User History](#user-history)
  - [Collaborative Filtering Recommendations](#collaborative-filtering-recommendations)
- [How Recommendations Work (Simple Terms)](#how-recommendations-work-simple-terms)
- [Tech Stack](#tech-stack)
- [Running Tests](#running-tests)
- [FAQ](#faq)

---

## Overview
This project is a smart product recommendation system. Users can register, log in, browse products, like/view/purchase them, and get personalized recommendations based on their actions and product features.

---

## How It Works (Layman Explanation)
- **You sign up and log in.**
- **You browse a catalog of products** (with images, prices, categories, etc).
- **You can like, view, or purchase products.**
- **The system remembers your actions** and uses them to recommend products you might like.
- **Recommendations are powered by AI:**
  - Looks at product features (like category, description, rating).
  - Looks at what you and similar users have liked or bought.
- **You can see your own history** of interactions.

---

## Backend Setup
1. **Go to the backend folder:**
   ```sh
   cd backend
   ```
2. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```
3. **Run the FastAPI server:**
   ```sh
   uvicorn main:app --reload
   ```
   The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Frontend Setup
1. **Go to the frontend folder:**
   ```sh
   cd frontend
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Run the React app:**
   ```sh
   npm start
   ```
   The app will open at [http://localhost:3000](http://localhost:3000)

---

## Database Structure
- **SQLite database** (`test.db` in `backend/`)
- **Tables:**
  - `users`: Stores user info (username, hashed password)
  - `user_interactions`: Tracks every view, like, or purchase by users
- **Product data** is loaded from a JSON file (`products.json`), not stored in the database.

---

## Authentication & Security
- **Passwords are never stored in plain text.**
  - They are hashed using bcrypt (very secure).
- **When you log in, you get a JWT token.**
  - This token proves who you are for future requests.
  - The token contains your username and user ID, and expires after 30 minutes.
- **You must include this token in the `Authorization` header** for actions like liking, viewing, or purchasing products.

---

## API Endpoints (with Examples)

### User Registration & Login

#### Register
- **POST** `/register`
- **Request:**
  ```json
  { "username": "alice", "password": "mypassword" }
  ```
- **Response:**
  ```json
  { "id": 1, "username": "alice" }
  ```

#### Login
- **POST** `/login`
- **Request:** (form data)
  - `username=alice&password=mypassword`
- **Response:**
  ```json
  { "access_token": "...", "token_type": "bearer" }
  ```
- **How to use:** Save `access_token` and send it as `Authorization: Bearer <token>` in future requests.

---

### Product Catalog

#### List Products
- **GET** `/products/?category=Home&search=art&page=1&page_size=10`
- **Query Parameters:**
  - `category` (optional): Filter by category
  - `search` (optional): Search by product name
  - `page`, `page_size`: Pagination
- **Response:**
  ```json
  {
    "total": 100,
    "page": 1,
    "page_size": 10,
    "products": [
      {
        "product_id": 1,
        "product_name": "Inspirational Wall Art",
        "category": "Home",
        "subcategory": "Decorative Wall Art & Accessories",
        "price": 932.46,
        "quantity_in_stock": 485,
        "manufacturer": "Fivebridge",
        "description": "...",
        "weight": 0.9,
        "dimensions": "...",
        "release_date": "12/7/2018",
        "rating": 3.4,
        "is_featured": true,
        "is_on_sale": false,
        "sale_price": 194.49,
        "image_url": "http://dummyimage.com/244x100.png/cc0000/ffffff"
      },
      ...
    ]
  }
  ```

---

### Product Details
- **GET** `/products/{product_id}`
- **Response:**
  ```json
  {
    "product_id": 1,
    "product_name": "Inspirational Wall Art",
    ...
  }
  ```

---

### Recommendations

#### Content-Based Recommendations
- **GET** `/recommendations/{product_id}`
- **Returns:** List of similar products (based on features like description, category, rating)
- **Response:**
  ```json
  [
    { "product_id": 2, "product_name": "Mango Chutney", ... },
    ...
  ]
  ```

#### Collaborative Filtering Recommendations
- **GET** `/collab-recommendations/{user_id}`
- **Returns:** Products liked/purchased by users similar to you
- **Response:**
  ```json
  [
    { "product_id": 5, "product_name": "Dog Collar", ... },
    ...
  ]
  ```

---

### User Interactions (View, Like, Purchase)

#### Track a View
- **POST** `/view`
- **Body:**
  ```json
  { "user_id": 1, "product_id": 2 }
  ```
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
  ```json
  { "id": 10, "user_id": 1, "product_id": 2, "interaction_type": "view", "timestamp": "..." }
  ```

#### Track a Like
- **POST** `/like`
- **Body:**
  ```json
  { "user_id": 1, "product_id": 2 }
  ```
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
  ```json
  { "id": 11, "user_id": 1, "product_id": 2, "interaction_type": "like", "timestamp": "..." }
  ```

#### Track a Purchase
- **POST** `/purchase`
- **Body:**
  ```json
  { "user_id": 1, "product_id": 2 }
  ```
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
  ```json
  { "id": 12, "user_id": 1, "product_id": 2, "interaction_type": "purchase", "timestamp": "..." }
  ```

---

### User History
- **GET** `/user/{user_id}/history`
- **Returns:** All products the user has viewed, liked, or purchased (with timestamps)
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "user_id": 1,
    "history": [
      { "id": 10, "user_id": 1, "product_id": 2, "interaction_type": "view", "timestamp": "..." },
      ...
    ]
  }
  ```

---

## How Recommendations Work (Simple Terms)

### Content-Based
- The system looks at the features of a product (like its description, category, and rating).
- It finds other products with similar features using AI math (TF-IDF and cosine similarity).
- You get a list of products that are "like" the one you are viewing.

### Collaborative Filtering
- The system looks at what you and other users have liked or purchased.
- If users similar to you liked something you haven't seen, it recommends those products to you.
- This is how Netflix or Amazon recommends things: "People like you also liked..."

---

## Tech Stack
- **Backend:** FastAPI (Python), SQLite, SQLAlchemy, bcrypt, JWT, scikit-learn, pandas
- **Frontend:** React.js (see `frontend/README.md` for details)

---

## Running Tests
1. **From the backend directory:**
   ```sh
   pytest
   ```
   This will run all backend tests to make sure everything works.

---

## FAQ

**Q: Where is my data stored?**
- User accounts and interactions are stored in `backend/test.db` (SQLite database).
- Product info is loaded from `backend/products.json`.

**Q: How do I see my database?**
- Use [DB Browser for SQLite](https://sqlitebrowser.org/) or a VS Code SQLite extension to open `test.db`.

**Q: How do I reset the database?**
- Delete `test.db` and restart the backend. A new, empty database will be created.

**Q: How do I get my user ID?**
- After login, decode your JWT token (the backend now includes `user_id` in the token payload).

**Q: Can I add more products?**
- Yes! Add them to `backend/products.json` (make sure to follow the same format).

---

## Code Walkthrough (What Happens in the Backend)

- **`main.py`**: The main FastAPI app. Handles all API endpoints, loads products, and runs the recommendation logic.
- **`models.py`**: Defines the database tables (users, user_interactions).
- **`schemas.py`**: Defines the format of data sent/received by the API (using Pydantic).
- **`auth.py`**: Handles password hashing and JWT token creation/verification.
- **`database.py`**: Sets up the SQLite database and manages connections.
- **`products.json`**: Contains all product data (loaded at startup).

**How a request works:**
1. You send a request (e.g., to like a product).
2. FastAPI receives it, checks your token, and updates the database.
3. For recommendations, the backend uses AI math to find similar products or products liked by similar users.
4. The response is sent back as JSON for the frontend to display.

---

**For more details, see the code files in the `backend/` folder.**
