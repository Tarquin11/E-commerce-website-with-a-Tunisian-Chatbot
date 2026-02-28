import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Register from './components/Register';
import Login from './components/Login';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderConfirmation from './components/OrderConfirmation';
import Profile from './components/Profile';
import Collection from './components/Collection';
import PositionCarousel from './components/PositionCarousel';
import { User, CartItemWithProduct, Product } from './types';
import { getUserProfile, clearAuthToken, setAuthToken, addToCart, getCart, removeFromCart, updateCartQuantity } from './api/api';
import './App.css';
import './components/styles.css';
import './styles/products.css';
import Home from './components/home';
import Chatbot from './components/Chatbot';


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
    console.log('[debug] App useEffect ran, token=', localStorage.getItem('token'));
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
      // Load cart from backend after login
      try {
        const cartData = await getCart();
        setCartItems(cartData || []);
      } catch (err) {
        console.error('Failed to load cart:', err);
        setCartItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (token: string, userData: User) => {
    console.log('[LOGIN] Setting token and user:', { token: token.substring(0, 20) + '...', user: userData });
    localStorage.setItem('token', token);
    setAuthToken(token);
    setUser(userData);
    getCart()
      .then(cartData => {
        setCartItems(cartData || []);
      })
      .catch(err => {
        console.error('Failed to load cart after login:', err);
        setCartItems([]);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    clearAuthToken();
    setUser(null);
    setCartItems([]);
  };
  const handleAddToCart = async (product: Product, quantity: number = 1, meta?: Record<string, any>) => {
    try {
      console.log(`[ADD_TO_CART] Adding product ${product.id} with quantity ${quantity}`);
      await addToCart(product.id, quantity, meta);
      console.log(`[ADD_TO_CART] Successfully added to backend`);
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === product.id && JSON.stringify(item.meta || {}) === JSON.stringify(meta || {}));
        if (existingItem) {
          return prevItems.map(item =>
            item.productId === product.id && JSON.stringify(item.meta || {}) === JSON.stringify(meta || {})
              ? { ...item, quantity: existingItem.quantity + quantity }
              : item
          );
        } else {
          const newItem: CartItemWithProduct = {
            productId: product.id,
            quantity: quantity,
            product: product,
            meta: meta,
          } as any;
          return [...prevItems, newItem];
        }
      });
      console.log(`Added ${product.name} to cart`);
      alert(`${product.name} added to cart!`);
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to add item to cart: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateCartQuantity = async (productId: number, quantity: number) => {
    try {
      await updateCartQuantity(productId, quantity);
      setCartItems(items =>
        items.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Failed to update cart:', error);
      alert('Failed to update cart quantity.');
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    try {
      await removeFromCart(productId);
      setCartItems(items => items.filter(item => item.productId !== productId));
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      alert('Failed to remove item from cart.');
    }
  };

  const handleOrderSuccess = () => {
    setCartItems([]);
  };

  if (isLoading) {
    return <div>Loading...</div>; 
  }

  return (
    <Router>
      <div className="site-wrap">
        <Navbar isLoggedIn={!!user} onLogout={handleLogout} />
        <Chatbot />
        
        {/* 💡 3. UPDATED ROUTES */}
        <Routes>
          
          {/* Route 1: Home Page ('/') now shows 'Home' component */}
          <Route 
            path="/" 
            element={<Home onAddToCart={handleAddToCart} />} 
          />
          
          {/* Route 2: Products Page ('/products') now shows 'ProductList' */}
          <Route 
            path="/products" 
            element={<ProductList onAddToCart={handleAddToCart} isLoggedIn={!!user} />} 
          />

          <Route
            path="/product/:id"
            element={<ProductDetail onAddToCart={handleAddToCart} />}
          />

          {/* Player collection/profile pages */}
          <Route
            path="/collection/:slug"
            element={<Collection />}
          />

          {/* Position carousel pages */}
          <Route
            path="/position/:position"
            element={<PositionCarousel />}
          />
          
          {/* --- Other Routes --- */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/products" replace /> : <Login setToken={handleLogin} />} 
          />
          
          <Route 
            path="/register" 
            element={user ? <Navigate to="/products" replace /> : <Register />} 
          />
          
          <Route 
            path="/cart" 
            element={
              <Cart 
                items={cartItems}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveFromCart}
              />
            } 
          />

          <Route 
            path="/checkout" 
            element={user ? (
              <Checkout 
                items={cartItems}
                onOrderSuccess={handleOrderSuccess}
              />
            ) : (
              <Navigate to="/login" replace />
            )} 
          />

          <Route 
            path="/order-confirmation" 
            element={<OrderConfirmation />} 
          />
          
          <Route 
            path="/profile" 
            element={user ? <Profile user={user} /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;