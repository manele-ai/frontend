import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import FAQ from '../components/ui/FAQ';
import ScrollAnimation from '../components/ui/ScrollAnimation';
import { db } from '../services/firebase';
import { redirectToSubscriptionCheckout } from '../services/stripe/subscription';
import '../styles/TarifePage.css';

export default function TarifePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'usersPublic', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsSubscribed(userData.isSubscribed);
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
    navigate('/generate');
  };

  return (
    <div 
      className="tarife-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="tarife-container">
        <ScrollAnimation direction="up" delay={0.1}>
          <div className="tarife-header">
            <span className="tarife-title-emoji">💰</span>
            <h1 className="tarife-title">Tarife</h1>
          </div>
        </ScrollAnimation>
        
        <ScrollAnimation direction="up" delay={0.2}>
          <div className="pricing-cards">
            {/* Card 1 - Standard */}
            <div className="pricing-card standard">
              <div className="card-content">
                <div className="price">24.99 RON</div>
                <div className="description">
                  Prețul standard al unei manele generate.
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
                <div className="price">💎 29.99 RON/luna</div>
                <div className="features">
                  <div className="feature">
                    <span className="checkmark">✓</span>
                    1 manea gratis in fiecare lună.
                  </div>
                  <div className="feature">
                    <span className="checkmark">✓</span>
                    1 dedicație gratis in fiecare lună.
                  </div>
                  <div className="feature">
                    <span className="checkmark">✓</span>
                    10 RON reducere la orice manea generată pe perioada abonamentului.
                  </div>
                </div>
                {!isSubscribed && (
                  <button 
                    className="subscribe-btn"
                    onClick={redirectToSubscriptionCheckout}
                  >
                    <span>Aboneaza-te</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 3 - Premium */}
            <div className="pricing-card premium">
              <div className="card-content">
                <div className="price">34.99 RON</div>
                <div className="description">
                  Prețul standard al unei manele generate + dedicație.
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
        </ScrollAnimation>
        
        {/* FAQ Section */}
        <div style={{ marginTop: '80px' }}>
          <ScrollAnimation direction="up" delay={0.2}>
            <FAQ />
          </ScrollAnimation>
        </div>
      </div>
    </div>
  );
} 