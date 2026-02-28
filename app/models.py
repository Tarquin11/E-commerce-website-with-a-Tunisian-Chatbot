from . import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, index=True, nullable=False)
    email = db.Column(db.String(255), unique=True, index=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), unique=True, index=True, nullable=True)
    otp_code = db.Column(db.String(10), nullable=True)
    otp_expires_at = db.Column(db.DateTime, nullable=True)
    # Persistent chatbot profile data
    measurements = db.Column(db.JSON, nullable=True)
    preferences = db.Column(db.JSON, nullable=True)
    preferred_language = db.Column(db.String(10), nullable=True)

    cart_items = db.relationship('Cart', back_populates='user', cascade='all, delete-orphan')
    orders = db.relationship('Order', back_populates='user', cascade='all, delete-orphan')


class Club(db.Model):
    __tablename__ = 'clubs'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    logo_url = db.Column(db.String(1024))
    description = db.Column(db.Text)
    country = db.Column(db.String(255))
    league = db.Column(db.String(255), default='Premier League')
    products = db.relationship('Product', back_populates='club', lazy='dynamic')

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), index=True, nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False, default=0.0)
    stock = db.Column(db.Integer, nullable=False, default=0)
    image_url = db.Column(db.String(1024))
    category = db.Column(db.String(255))
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)
    is_legendary = db.Column(db.Boolean, default=False)
    player_slug = db.Column(db.String(100), index=True)
    tournament = db.Column(db.String(255))
    season = db.Column(db.String(255))
    is_deleted = db.Column(db.Boolean, default=False)
    
    club = db.relationship('Club', back_populates='products')


class Cart(db.Model):
    __tablename__ = 'carts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    meta = db.Column(db.JSON, nullable=True)

    user = db.relationship('User', back_populates='cart_items')
    product = db.relationship('Product')


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')
    
    street_address = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(255), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    
    created_at = db.Column(db.DateTime, default=db.func.now())
    
    user = db.relationship('User', back_populates='orders')
    order_items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False) 
    
    order = db.relationship('Order', back_populates='order_items')
    product = db.relationship('Product')
