import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/PaymentPage.css';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ style, from, to, dedication }) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to loading page with song generation data
      navigate('/loading', {
        state: {
          taskId: 'mock-task-id-' + Date.now(),
          style,
          from,
          to,
          dedication
        }
      });
    } catch (err) {
      setError('Plata a eșuat. Încearcă din nou.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="payment-form">
      <div className="payment-summary">
        <h3>Sumar comandă</h3>
        <p><strong>Stil:</strong> {style}</p>
        {from && <p><strong>De la:</strong> {from}</p>}
        {to && <p><strong>Pentru:</strong> {to}</p>}
        {dedication && <p><strong>Dedicație:</strong> {dedication}</p>}
        <p><strong>Preț:</strong> 9.99 RON</p>
      </div>

      <div className="payment-method">
        <h3>Metodă de plată</h3>
        <div className="card-element">
          {/* Stripe Elements would go here */}
          <div className="mock-card-input">
            <input 
              type="text" 
              placeholder="Numărul cardului" 
              disabled={isProcessing}
            />
            <div className="card-details">
              <input 
                type="text" 
                placeholder="MM/YY" 
                disabled={isProcessing}
              />
              <input 
                type="text" 
                placeholder="CVC" 
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        className="payment-button"
        disabled={isProcessing}
      >
        {isProcessing ? 'Se procesează...' : 'Plătește 9.99 RON'}
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </form>
  );
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from HomePage
  const { style, from, to, dedication } = location.state || {};

  // Redirect if no style selected
  if (!style) {
    navigate('/');
    return null;
  }

  return (
    <div className="payment-page">
      {/* Butonul de Înapoi eliminat */}
      <div className="container">
        <h1 className="title">Plată</h1>
        <p className="subtitle">Finalizează comanda pentru a genera maneaua</p>
        <Elements stripe={stripePromise}>
          <PaymentForm 
            style={style}
            from={from}
            to={to}
            dedication={dedication}
          />
        </Elements>
      </div>
    </div>
  );
} 