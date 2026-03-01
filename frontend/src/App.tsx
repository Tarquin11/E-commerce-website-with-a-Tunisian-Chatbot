import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { addToCart, clearAuthToken, getCart, getUserProfile, removeFromCart, setAuthToken, updateCartQuantity } from './api/api';
import Cart from './components/Cart';
import Chatbot from './components/Chatbot';
import Checkout from './components/Checkout';
import Collection from './components/Collection';
import Home from './components/home';
import Login from './components/Login';
import Navbar from './components/Navbar';
import OrderConfirmation from './components/OrderConfirmation';
import PositionCarousel from './components/PositionCarousel';
import ProductDetail from './components/ProductDetail';
import ProductList from './components/ProductList';
import Profile from './components/Profile';
import Register from './components/Register';
import { CartItemWithProduct, Product, User } from './types';
import './App.css';
import './components/styles.css';
import './styles/products.css';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setAuthToken(token);
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
      const cartData = await getCart();
      setCartItems(cartData || []);
    } catch (error) {
      console.error('Failed to load session:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    setUser(userData);
    getCart()
      .then((cartData) => setCartItems(cartData || []))
      .catch((err) => {
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
      await addToCart(product.id, quantity, meta);
      setCartItems((prevItems) => {
        const existingItem = prevItems.find(
          (item) => item.productId === product.id && JSON.stringify(item.meta || {}) === JSON.stringify(meta || {})
        );
        if (existingItem) {
          return prevItems.map((item) =>
            item.productId === product.id && JSON.stringify(item.meta || {}) === JSON.stringify(meta || {})
              ? { ...item, quantity: existingItem.quantity + quantity }
              : item
          );
        }
        const newItem: CartItemWithProduct = {
          productId: product.id,
          quantity,
          product,
          meta,
        } as CartItemWithProduct;
        return [...prevItems, newItem];
      });
      alert(`${product.name} added to cart!`);
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      alert(`Failed to add item to cart: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    }
  };

  const handleUpdateCartQuantity = async (productId: number, quantity: number) => {
    try {
      await updateCartQuantity(productId, quantity);
      setCartItems((items) => items.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
    } catch (error) {
      console.error('Failed to update cart:', error);
      alert('Failed to update cart quantity.');
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    try {
      await removeFromCart(productId);
      setCartItems((items) => items.filter((item) => item.productId !== productId));
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

        <Routes>
          <Route path="/" element={<Home onAddToCart={handleAddToCart} />} />
          <Route path="/products" element={<ProductList onAddToCart={handleAddToCart} isLoggedIn={!!user} />} />
          <Route path="/product/:id" element={<ProductDetail onAddToCart={handleAddToCart} />} />
          <Route path="/collection/:slug" element={<Collection />} />
          <Route path="/position/:position" element={<PositionCarousel />} />
          <Route path="/login" element={user ? <Navigate to="/products" replace /> : <Login setToken={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to="/products" replace /> : <Register />} />
          <Route
            path="/cart"
            element={<Cart items={cartItems} onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveFromCart} />}
          />
          <Route
            path="/checkout"
            element={
              user ? <Checkout items={cartItems} onOrderSuccess={handleOrderSuccess} /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
