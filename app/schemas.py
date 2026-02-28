from pydantic import BaseModel

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True 

class ClubBase(BaseModel):
    name: str
    logo_url: str | None = None
    description: str | None = None
    country: str | None = None
    league: str | None = None

class ClubCreate(ClubBase):
    pass

class ClubResponse(ClubBase):
    id: int
    
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    stock: int
    club_id: int

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    club: ClubResponse

    class Config:
        from_attributes = True

class CartBase(BaseModel):
    product_id: int
    quantity: int

class CartCreate(CartBase):
    pass

class CartResponse(CartBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True  

class OrderBase(BaseModel):
    total_price: float
    status: str = "pending"

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True  
