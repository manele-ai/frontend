import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/PaymentPage.css';

// Replace with your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ style, from, to, dedication }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Fetch clientSecret from backend
      const clientSecret = 'pi_test_secret_xxx'; // mock
      
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) }
      });
      
      if (stripeError) {
        setError(stripeError.message);
      } else {
        // Payment successful, navigate to result page
        navigate('/result', { 
          state: { 
            style, 
            from, 
            to, 
            dedication, 
            payment: 'success',
            taskId: 'mock-task-id' // This should come from the backend
          } 
        });
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="payment-form">
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '18px',
              color: '#FFD700',
              backgroundColor: '#23242b',
              border: '2px solid #FFD700',
              borderRadius: '8px',
              padding: '18px 16px',
              minHeight: '64px',
              lineHeight: '44px',
              '::placeholder': { color: '#FFD700' },
            },
            invalid: {
              color: '#ff3b30',
            },
          },
        }}
      />
      <button 
        type="submit" 
        disabled={loading} 
        className="button payment-button"
      >
        {loading ? 'Se procesează...' : 'Plătește cu cardul'}
      </button>
      {error && <div className="error-text">{error}</div>}
    </form>
  );
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { style, from, to, dedication } = location.state || {};

  // If no state, redirect to home
  if (!style) {
    navigate('/');
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="payment-page">
        <button
          onClick={() => navigate('/')}
          className="back-button"
        >
          ←
        </button>
        
        <div className="container">
          <h1 className="title">Plată cu cardul</h1>
          <p className="subtitle">Completează plata pentru a genera piesa</p>
          
          <PaymentForm 
            style={style} 
            from={from} 
            to={to} 
            dedication={dedication} 
          />
        </div>
      </div>
    </Elements>
  );
} 