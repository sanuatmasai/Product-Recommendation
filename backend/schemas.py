from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Product schema for a single product
class Product(BaseModel):
    product_id: int
    product_name: str
    category: str
    subcategory: str
    price: float
    quantity_in_stock: int
    manufacturer: str
    description: str
    weight: float
    dimensions: str
    release_date: str
    rating: float
    is_featured: bool
    is_on_sale: bool
    sale_price: float
    image_url: str

# List schema for paginated products
class ProductList(BaseModel):
    total: int
    page: int
    page_size: int
    products: list[Product]

# User interaction creation schema
class UserInteractionCreate(BaseModel):
    user_id: str
    product_id: int
    # interaction_type: str  # 'view', 'like', 'purchase'

# User interaction output schema
class UserInteractionOut(BaseModel):
    id: int
    user_id: int
    product_id: int
    interaction_type: str
    timestamp: datetime
    model_config = {"from_attributes": True}

# User history response schema
class UserHistory(BaseModel):
    user_id: int
    history: list[UserInteractionOut] 