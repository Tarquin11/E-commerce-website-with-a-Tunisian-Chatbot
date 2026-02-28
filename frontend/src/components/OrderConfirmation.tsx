import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EUR_TO_TND } from '../utils/currency';

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, total } = location.state || { orderId: null, total: 0 };

  if (!orderId) {
    return (
      <div className="confirmation-container">
        <h2>Order Not Found</h2>
        <p>We couldn't find your order. <a onClick={() => navigate('/products')}>Return to shopping</a></p>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="confirmation-message">
        Your order has been successfully placed !</p>
        
        <div className="order-details">
          <div className="detail-row">
            <span className="detail-label">Order ID:</span>
            <span className="detail-value">#{orderId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Total Amount:</span>
            <span className="detail-value">€{total.toFixed(2)} / {(total * EUR_TO_TND).toFixed(2)} TND</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value">Pending</span>
          </div>
        </div>

        <div className="confirmation-text">
          <p>
            A confirmation email has been sent to your email address. 
            You can track your order status from your profile.
          </p>
        </div>

        <div className="confirmation-actions">
          <button 
            className="action-button primary"
            onClick={() => navigate('/profile')}
          >
            View Orders in Profile
          </button>
          <button 
            className="action-button secondary"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
