import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { db } from '../services/firebase';
import { createSubscriptionCheckoutSession } from '../services/firebase/functions';
import { getStripe } from '../services/stripe';
import '../styles/TarifePage.css';

export default function TarifePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const subscriptionStatus = userData.subscription?.status;
            setIsSubscribed(subscriptionStatus === 'active');
          } else {
            setIsSubscribed(false);
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
          setIsSubscribed(false);
        }
      } else {
        setIsSubscribed(false);
      }
    };

    checkSubscriptionStatus();
    const interval = setInterval(checkSubscriptionStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  const handleGenerateNow = () => {
    navigate('/select-style');
  };

  const onClickSubscription = async () => {
    const { sessionId } = await createSubscriptionCheckoutSession();
    if (sessionId) {
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        console.error('A apărut o eroare la plata. Încearcă din nou.');
      }
    } else {
      console.error('Failed to create subscription checkout session');
    }
  };

  return (
    <div className="tarife-page">
      <div className="tarife-container">
        <h1 className="tarife-title">Tarife</h1>
        
        <div className="pricing-cards">
          {/* Card 1 - Standard */}
          <div className="pricing-card standard">
            <div className="card-content">
              <div className="price">59.99 RON</div>
              <div className="description">
                Pretul standard al unei manele generate.
              </div>
              <button 
                className="generate-btn"
                onClick={handleGenerateNow}
              >
                <span>Generează acum</span>
              </button>
            </div>
          </div>

          {/* Card 2 - Subscription (Featured) */}
          <div className="pricing-card subscription featured">
            <div className="card-content">
              <div className="price">29.99 RON/luna</div>
              <div className="features">
                <div className="feature">
                  <span className="checkmark">✓</span>
                  2 manele gratuite in fiecare luna
                </div>
                <div className="feature">
                  <span className="checkmark">✓</span>
                  25% reducere la orice manea generata pe perioada abonamentului
                </div>
              </div>
              {!isSubscribed && (
                <button 
                  className="subscribe-btn"
                  onClick={onClickSubscription}
                >
                  <span>Aboneaza-te</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 3 - Premium */}
          <div className="pricing-card premium">
            <div className="card-content">
              <div className="price">74.99 RON</div>
              <div className="description">
                Pretul standard al unei manele generate + dedicatie.
              </div>
              <button 
                className="generate-btn"
                onClick={handleGenerateNow}
              >
                <span>Generează acum</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 