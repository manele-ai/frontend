import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSubscriptionCheckoutSession } from 'services/firebase/functions';
import { getStripe } from 'services/stripe';
import { useAuth } from '../components/auth/AuthContext';
import Button from '../components/ui/Button';
import { styles } from '../data/stylesData';
import { db } from '../services/firebase';
import '../styles/HomePage.css';


 

function ReusableCard({ background, title, subtitle, buttonText, onButtonClick }) {
  const imageUrl = background.replace('url(', '').replace(') center/cover no-repeat', '');
  
  return (
    <div 
      className="style-example-card" 
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div className="style-example-card-overlay"></div>
      <div className="style-example-card-content">
        <h2 className="style-example-title">{title}</h2>
        <p className="style-example-subtitle">{subtitle}</p>
        <Button className="hero-btn style-example-card-button" onClick={onButtonClick}>
          <span className="hero-btn-text">{buttonText}</span>
        </Button>
      </div>
    </div>
  );
}

export default function HomePage() {
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
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-card">
          <div className="hero-card-content">
            <h2 className="hero-title">Genereaza-ti propria manea in cateva minute.</h2>
            <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
            <div className="hero-buttons" style={{ 
              display: 'flex', 
              gap: '20px',
              alignItems: 'center' 
            }}>
              <Button className="hero-btn hero-section-button" onClick={() => navigate('/select-style')}>
                <span className="hero-btn-text">Genereaza acum</span>
              </Button>
              {!isSubscribed && (
                <Button 
                  className="hero-btn hero-section-button"
                  onClick={onClickSubscription}
                >
                  <span className="hero-btn-text">Abonează-te</span>
                </Button>
              )}
            </div>
          </div>
          <div className="hero-card-img">
            <div className="ellipse-bg"></div>
            <img src="/icons/Microphone.png" alt="Microfon" className="hero-icon" />
          </div>
        </div>
      </div>
      {/* <HeroCard /> */}

      {/* Main Content Container */}
      <div className="main-content-container">
        <div className="styles-grid">
          {styles.map((style, index) => (
            <ReusableCard
              key={index}
              background={`url(${style.image}) center/cover no-repeat`}
              title={style.title}
              subtitle={style.subtitle}
              buttonText="Exemple"
              onButtonClick={() => navigate('/exemple')}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 