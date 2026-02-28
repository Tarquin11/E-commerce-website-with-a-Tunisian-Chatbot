import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItemWithProduct } from '../types';
import { placeOrder } from '../api/api';
import { EUR_TO_TND } from '../utils/currency';

interface CheckoutProps {
  items: CartItemWithProduct[];
  onOrderSuccess: () => void;
}

interface BillingAddress {
  street_address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
}

const Checkout: React.FC<CheckoutProps> = ({ items, onOrderSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'EUR' | 'TND'>('EUR');
  const [formData, setFormData] = useState<BillingAddress>({
    street_address: '',
    city: '',
    postal_code: '',
    country: '',
    phone: ''
  });
  const [step, setStep] = useState<number>(1); 
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card' | 'cod'>('paypal');

  const [cardData, setCardData] = useState({
    cardholder: '',
    number: '',
    expiry: '',
    cvc: ''
  });
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);

  const SHIPPING_COST = 15;
  const JERSEY_TAX_RATE = 0.15; 
  const SHIPPING_TAX_RATE = 0.07; 

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const calculateJerseyTax = () => {
    return calculateSubtotal() * JERSEY_TAX_RATE;
  };

  const calculateShippingTax = () => {
    return SHIPPING_COST * SHIPPING_TAX_RATE;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateJerseyTax() + SHIPPING_COST + calculateShippingTax();
  };

  // Coupon handling: read from localStorage if set
  const couponCode = typeof window !== 'undefined' ? (localStorage.getItem('coupon_code') || '') : '';
  const VALID_COUPONS = new Set(['12345678', '00000000', '87654321', 'CR7GOAT']);
  const calculateDiscount = () => {
    if (!couponCode || !VALID_COUPONS.has(couponCode)) return 0;
    // build jersey unit prices
    const jerseyUnitPrices: number[] = [];
    items.forEach(it => {
      if ((it.product.category || '').toLowerCase() === 'jersey') {
        for (let i = 0; i < it.quantity; i++) jerseyUnitPrices.push(it.product.price);
      }
    });
    const jerseyCount = jerseyUnitPrices.length;
    if (jerseyCount === 0) return 0;
    if (jerseyCount <= 3) {
      const jerseySubtotal = jerseyUnitPrices.reduce((s, p) => s + p, 0);
      return jerseySubtotal * 0.15;
    }
    return Math.min(...jerseyUnitPrices);
  };
  const discountAmount = calculateDiscount();
  const subtotalAfterDiscount = Math.max(0, calculateSubtotal() - discountAmount);
  const jerseyTaxAfter = subtotalAfterDiscount * JERSEY_TAX_RATE; // approximate: backend uses jersey-specific tax calc
  const totalAfterDiscount = subtotalAfterDiscount + jerseyTaxAfter + SHIPPING_COST + calculateShippingTax();

  const formatPrice = (priceEur: number) => {
    if (currency === 'EUR') {
      return `€${priceEur.toFixed(2)}`;
    } else {
      return `${(priceEur * EUR_TO_TND).toFixed(2)} TND`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setError(null);


    if (step === 1) {
      if (!formData.street_address || !formData.city || !formData.postal_code || !formData.country) {
        setError('Please fill in all required fields');
        return;
      }
      setStep(2);
      return;
    }

    if (paymentMethod === 'card') {
      const { cardholder, number, expiry, cvc } = cardData;
      if (!cardholder || !number || !expiry || !cvc) {
        setError('Please fill in all credit card fields');
        return;
      }

      const numClean = number.replace(/\s+/g, '');
      if (!/^[0-9]{12,19}$/.test(numClean)) {
        setError('Please enter a valid card number');
        return;
      }
      if (!/^[0-9]{3,4}$/.test(cvc)) {
        setError('Please enter a valid CVC');
        return;
      }
    }
    const methodLabel = paymentMethod === 'paypal' ? 'PayPal' : paymentMethod === 'card' ? 'Credit Card' : 'Payment on Delivery';
    setProcessingMessage(`Be patient while we process your payment with ${methodLabel}...`);
    await new Promise((res) => setTimeout(res, 1200));

    setLoading(true);
    try {
      const body: any = { ...formData, payment_method: paymentMethod };
      if (paymentMethod === 'card') body.payment = { ...cardData };
      if (couponCode) body.coupon_code = couponCode;

      const response = await placeOrder(body);

      if (response.order_id) {
        onOrderSuccess();
        navigate('/order-confirmation', { state: { orderId: response.order_id, total: response.total_price } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
      setProcessingMessage(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-container">
        <h2>Checkout</h2>
        <p>Your cart is empty. <a href="/products">Continue shopping</a></p>
      </div>
    );
  }
  return (
    <div className="checkout-container">
      <div className="checkout-content">
        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-header">
            <h2>Order Summary</h2>
            <div className="currency-selector">
              <button 
                className={`currency-btn ${currency === 'EUR' ? 'active' : ''}`}
                onClick={() => setCurrency('EUR')}
              >
                EUR €
              </button>
              <button 
                className={`currency-btn ${currency === 'TND' ? 'active' : ''}`}
                onClick={() => setCurrency('TND')}
              >
                TND د.ت
              </button>
            </div>
          </div>
          <div className="summary-items">
            {items.map(item => (
              <div key={item.productId} className="summary-item">
                <div className="item-info">
                  <span className="item-name">{item.product.name}</span>
                  <span className="item-quantity">Qty: {item.quantity}</span>
                </div>
                <span className="item-price">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="summary-breakdown">
            <div className="breakdown-row">
              <span>Subtotal:</span>
              <span>{formatPrice(calculateSubtotal())}</span>
            </div>
            {discountAmount > 0 && (
              <div className="breakdown-row">
                <span>Discount{couponCode ? ` (${couponCode})` : ''}:</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="breakdown-row tax-row">
              <span>Jersey Tax (15%):</span>
              <span>{formatPrice(jerseyTaxAfter)}</span>
            </div>
            <div className="breakdown-row">
              <span>Shipping:</span>
              <span>{formatPrice(SHIPPING_COST)}</span>
            </div>
            <div className="breakdown-row tax-row">
              <span>Shipping Tax (7%):</span>
              <span>{formatPrice(calculateShippingTax())}</span>
            </div>
          </div>

          <div className="summary-total">
            <strong>Total: {formatPrice(totalAfterDiscount)}</strong>
          </div>
        </div>

        {/* Billing / Payment Form */}
        <div className="billing-form-section">
          <h2>{step === 1 ? 'Billing Address' : 'Payment Method'}</h2>
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="billing-form">
            {step === 1 ? (
            <div>
            <div className="form-group">
              <label htmlFor="street_address">Street Address *</label>
              <input
                id="street_address"
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="postal_code">Postal Code *</label>
                <input
                  id="postal_code"
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <input
                  id="country"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => navigate('/cart')}
              >
                Back to Cart
              </button>
              <button 
                type="submit" 
                className="submit-button"
              >
                Continue to Payment
              </button>
            </div>
          </div>
            ) : (
            <div>
              <div className="form-group">
                <label>Payment Method</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <label className="radio-label">
                    <input type="radio" name="payment" checked={paymentMethod === 'paypal'} onChange={() => setPaymentMethod('paypal')} />
                    <span className="radio-custom" aria-hidden></span>
                    <span className="radio-text">PayPal</span>
                  </label>

                  <label className="radio-label">
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    <span className="radio-custom" aria-hidden></span>
                    <span className="radio-text">Credit Card</span>
                  </label>
                      <label className="radio-label">
                        <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                        <span className="radio-custom" aria-hidden></span>
                        <span className="radio-text">Payment on Delivery</span>
                      </label>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div>
                  <div className="form-group">
                    <label>Cardholder Name *</label>
                    <input name="cardholder" value={cardData.cardholder} onChange={handleCardChange} />
                  </div>
                  <div className="form-group">
                    <label>Card Number *</label>
                    <input name="number" value={cardData.number} onChange={handleCardChange} placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry (MM/YY) *</label>
                      <input name="expiry" value={cardData.expiry} onChange={handleCardChange} placeholder="08/24" />
                    </div>
                    <div className="form-group">
                      <label>CVC *</label>
                      <input name="cvc" value={cardData.cvc} onChange={handleCardChange} placeholder="123" />
                    </div>
                  </div>
                </div>
              )}
              {processingMessage && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(99,91,255,0.08)', borderRadius: 8, color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                  {processingMessage}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setStep(1)}>Back</button>
                <button type="button" className="submit-button" onClick={() => handleSubmit()} disabled={loading}>{loading ? 'Processing...' : 'Pay & Place Order'}</button>
              </div>
            </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
export default Checkout;
