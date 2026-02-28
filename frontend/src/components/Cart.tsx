import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItemWithProduct, Product } from '../types';
import { getCart, getProducts } from '../api/api';
import { formatPrice, EUR_TO_TND } from '../utils/currency';
import '../styles/cart.css';

interface CartProps {
  items: CartItemWithProduct[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemoveItem }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const [error, setError] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<CartItemWithProduct[]>(items);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const SHIPPING_COST = 15;
  const VALID_COUPONS = new Set(['12345678', '00000000', '87654321', 'CR7GOAT']);
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  console.log('[CART_COMPONENT] Rendered with props items:', items.length);
  
  useEffect(() => {
    console.log('[CART] Cart component mounted/updated, items from props:', items.length);
    setLocalItems(items);
  }, [items]);
  useEffect(() => {
    console.log('[CART] Starting to fetch fresh cart data...');
    const fetchCart = async () => {
      try {
        console.log('[CART] Fetching fresh cart data from backend...');
        const freshCart = await getCart();
        console.log('[CART] Fresh cart data received:', freshCart);
        console.log('[CART] Fresh cart length:', freshCart?.length);
        if (freshCart && Array.isArray(freshCart)) {
          console.log('[CART] First item:', freshCart[0]);
          console.log('[CART] Setting localItems to:', freshCart);
          setLocalItems(freshCart);
          console.log('[CART] setLocalItems called with', freshCart.length, 'items');
        } else {
          console.error('[CART] Invalid cart data format:', freshCart);
          setLocalItems([]);
        }
      } catch (err) {
        console.error('[CART] Failed to fetch fresh cart:', err);
        console.error('[CART] Error details:', (err as any).response?.data || (err as any).message);
      }
    };
    fetchCart();
  }, []);

  // Recompute discount when items or applied coupon change
  useEffect(() => {
    if (!couponApplied) {
      setDiscountAmount(0);
      return;
    }
    // compute discount same as backend
    const jerseyUnitPrices: number[] = [];
    localItems.forEach(it => {
      if ((it.product.category || '').toLowerCase() === 'jersey') {
        for (let i = 0; i < it.quantity; i++) jerseyUnitPrices.push(it.product.price);
      }
    });
    const jerseyCount = jerseyUnitPrices.length;
    let discount = 0;
    if (jerseyCount > 0) {
      if (jerseyCount <= 3) {
        const jerseySubtotal = jerseyUnitPrices.reduce((s, p) => s + p, 0);
        discount = jerseySubtotal * 0.15;
      } else {
        discount = Math.min(...jerseyUnitPrices);
      }
    }
    setDiscountAmount(Number(discount.toFixed(2)));
  }, [localItems, couponApplied]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const prods = await getProducts();
        setRecommended((prods || []).slice(0, 6));
      } catch (err) {
        console.error('[CART] Failed to fetch recommended products', err);
      }
    };
    fetchRecommended();
  }, []);

  const calculateTotal = () => {
    return localItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const calculateDiscountedSubtotal = () => {
    const base = calculateTotal();
    return Math.max(0, base - discountAmount);
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setError('Quantity cannot be less than 1');
      return;
    }
    
    const item = localItems.find(i => i.product.id === productId);
    if (item && newQuantity > item.product.stock) {
      setError(`Only ${item.product.stock} items available`);
      return;
    }

    setError(null);
    onUpdateQuantity(productId, newQuantity);
  };
  if (!isLoggedIn) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <div className="empty-left">
            <h3>Please log in to start shopping</h3>
            <p>You need an account to add items to the cart and checkout. If you don't have one, register now.</p>
            <div className="empty-actions">
              <button className="btn primary" onClick={() => navigate('/login')}>Log In</button>
              <button className="btn ghost" onClick={() => navigate('/register')}>Register</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      {localItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-left">
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything yet. Explore our collection and add your favorite jerseys.</p>
            <div className="empty-actions">
              <button className="btn primary" onClick={() => navigate('/')}>Return Home</button>
              <button className="btn ghost" onClick={() => navigate('/products')}>Browse Clubs</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {error && <div className="error">{error}</div>}
          <div className="cart-items">
            {localItems.map((item) => (
              <div key={item.productId} className="cart-item">
                <img 
                  src={item.product.image_url} 
                  alt={item.product.name} 
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h3>{item.product.name}</h3>
                  {/* Small preview thumbnail with overlayed name/number for customized items */}
                  {item.meta && (item.meta.name || item.meta.number) && (
                    <div className="meta-preview" style={{ backgroundImage: `url(${item.product.image_url})` }}>
                      <div className="meta-overlay">
                        {item.meta.name && <div className="overlay-name">{String(item.meta.name)}</div>}
                        {item.meta.number && <div className="overlay-number">#{String(item.meta.number)}</div>}
                      </div>
                    </div>
                  )}
                  {/* Show customization metadata when present */}
                  {item.meta && (
                    <div className="item-meta">
                      {item.meta.size && <div className="meta-row"><strong>Size:</strong> {String(item.meta.size).toUpperCase()}</div>}
                      {(item.meta.name || item.meta.number) && (
                        <div className="meta-row">
                          <strong>Custom:</strong>
                          <span className="meta-values">
                            {item.meta.name ? ` ${item.meta.name}` : ''}
                            {item.meta.number ? ` #${item.meta.number}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="muted">Price: {formatPrice(item.product.price)}</p>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="remove-item"
                    onClick={() => onRemoveItem(item.product.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="item-total">
                  <div>€{(item.product.price * item.quantity).toFixed(2)}</div>
                  <div className="muted">{(item.product.price * item.quantity * EUR_TO_TND).toFixed(2)} TND</div>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-controls">
            <div className="promo">
                <input placeholder="Have a promo code?" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                <button className="apply" onClick={() => {
                  const code = (couponInput || '').trim();
                  if (!code) return setError('Please enter a promo code');
                  if (!VALID_COUPONS.has(code)) return setError('Invalid promo code');
                  setError(null);
                  setCouponApplied(code);
                  localStorage.setItem('coupon_code', code);
                }}>{couponApplied ? 'Applied' : 'Apply'}</button>
                {couponApplied && <div style={{ color: '#8ef', marginLeft: 8 }}>Code {couponApplied} applied</div>}
              </div>
            <div className="cart-summary">
              <div className="summary-row"><span>Subtotal</span><span>€{calculateTotal().toFixed(2)}</span></div>
              {discountAmount > 0 && (
                <div className="summary-row"><span>Discount</span><span>-€{discountAmount.toFixed(2)}</span></div>
              )}
              <div className="summary-row"><span>Shipping</span><span>€{SHIPPING_COST.toFixed(2)}</span></div>
              <div className="summary-row total"><span>Total</span><span>€{(calculateDiscountedSubtotal() + SHIPPING_COST).toFixed(2)}</span></div>
              <div className="summary-row muted"><span>Total (TND)</span><span>{((calculateDiscountedSubtotal() + SHIPPING_COST) * EUR_TO_TND).toFixed(2)} TND</span></div>
              <button 
                className="checkout-button primary"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;