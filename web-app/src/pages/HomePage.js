import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSubscriptionCheckoutSession } from 'services/firebase/functions';
import { getStripe } from 'services/stripe';
import LazyAudioPlayer from '../components/LazyAudioPlayer';
import { useAuth } from '../components/auth/AuthContext';
import Button from '../components/ui/Button';
import { styles } from '../data/stylesData';
import { db } from '../services/firebase';
import '../styles/HomePage.css';

function ReusableCard({ background, title, subtitle, styleValue, audioUrl }) {
  const navigate = useNavigate();
  const imageUrl = background.replace('url(', '').replace(') center/cover no-repeat', '');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Fallback audio URL in case the specific style audio fails
  const fallbackAudioUrl = '/music/mohanveena-indian-guitar-374179.mp3';
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleGenerateClick = () => {
    // Navigate to generate page with the selected style
    navigate('/generate', { 
      state: { 
        selectedStyle: styleValue,
        fromHomePage: true 
      } 
    });
  };
  
  return (
    <div 
      className="style-example-card" 
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div className="style-example-card-overlay"></div>
      <div className="style-example-card-content">
        <div className="style-example-card-content-inner">
          <h2 className="style-example-title">{title}</h2>
        </div>
        <div className="style-example-audio-player">
          <LazyAudioPlayer 
            audioUrl={audioUrl}
            fallbackAudioUrl={fallbackAudioUrl}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onError={() => console.error('Audio playback error')}
          />
        </div>
        <div className="style-example-generate-button">
          <Button 
            className="hero-btn hero-section-button" 
            onClick={handleGenerateClick}
          >
            <span className="hero-btn-text">Generează acum</span>
          </Button>
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
          const userRef = doc(db, 'usersPublic', user.uid);
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
        <div className="hero-card">
          <div className="hero-card-content">
            <h2 className="hero-title">GENEREAZĂ PROPRIA MANEA ACUM</h2>
            <p className="hero-subtitle">Generază acum două manele <br></br>la preț de una!</p>
            <div className="hero-buttons" style={{ 
              display: 'flex', 
              gap: '20px',
              alignItems: 'center' 
            }}>
              <Button className="hero-btn hero-section-button" onClick={() => navigate('/generate')}>
                <span className="hero-btn-text">Fă o manea!</span>
              </Button>
              {!isSubscribed && (
                <Button 
                  className="hero-btn subscription-btn"
                  onClick={onClickSubscription}
                >
                  <span className="hero-btn-text">Fă-ți abonament!</span>
                </Button>
              )}
            </div>
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
              styleValue={style.value}
              audioUrl={style.audioUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 