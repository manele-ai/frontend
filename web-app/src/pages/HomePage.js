import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSubscriptionCheckoutSession } from 'services/firebase/functions';
import { getStripe } from 'services/stripe';
import AudioPlayer from '../components/AudioPlayer';
import { useAuth } from '../components/auth/AuthContext';
import Button from '../components/ui/Button';
import { styles } from '../data/stylesData';
import { db } from '../services/firebase';
import '../styles/HomePage.css';


 

function ReusableCard({ background, title, subtitle }) {
  const imageUrl = background.replace('url(', '').replace(') center/cover no-repeat', '');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Hardcoded audio URL - aceeași piesă pentru toate stilurile
  const audioUrl = '/music/mohanveena-indian-guitar-374179.mp3';
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  return (
    <div 
      className="style-example-card" 
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div className="style-example-card-overlay"></div>
      <div className="style-example-card-content">
        <h2 className="style-example-title">{title}</h2>
        <p className="style-example-subtitle">{subtitle}</p>
        <div className="style-example-audio-player">
          <AudioPlayer 
            audioUrl={audioUrl}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onError={() => console.error('Audio playback error')}
          />
        </div>
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
    <div 
      className="home-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-section-overlay"></div>
        <div className="hero-card">
          <div className="hero-card-content">
            <h2 className="hero-title">Genereaza-ti propria manea in cateva minute.</h2>
            <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
            <div className="hero-buttons" style={{ 
              display: 'flex', 
              gap: '20px',
              alignItems: 'center' 
            }}>
              <Button className="hero-btn hero-section-button" onClick={() => navigate('/generate')}>
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
            <div className="hero-image-overlay"></div>
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
            />
          ))}
        </div>
      </div>
    </div>
  );
} 