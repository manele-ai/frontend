import { useNavigate } from 'react-router-dom';
import { createSubscriptionCheckoutSession } from 'services/firebase/functions';
import { getStripe } from 'services/stripe';
import Button from '../components/ui/Button';
import { styles } from '../data/stylesData';
import '../styles/HomePage.css';

function HeroCard() {
  const navigate = useNavigate();

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
    <div className="hero-card">
      <div className="hero-card-content">
        <h2 className="hero-title">Genereaza-ti propria manea in cateva minute.</h2>
        <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
        <div className="hero-buttons" style={{ 
          display: 'flex', 
          gap: '20px',
          alignItems: 'center' 
        }}>
          <Button variant="secondary" size="small" className="hero-btn" onClick={() => navigate('/select-style')}>
            <span className="hero-btn-text">Generează acum</span>
          </Button>
          <Button 
            variant="primary" 
            size="small" 
            className="hero-btn subscription-btn"
            onClick={onClickSubscription}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 30%, #FFD700 50%, #FDB931 70%, #FFD700 100%)',
              color: '#000000',
              fontWeight: '600',
              border: '2px solid #B8860B',
              boxShadow: '0 4px 15px rgba(218, 165, 32, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.5)',
              textShadow: '0 1px 1px rgba(255, 255, 255, 0.5)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              padding: '12px 24px',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(218, 165, 32, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(218, 165, 32, 0.4), inset 0 0 10px rgba(255, 255, 255, 0.5)';
            }}
          >
            <span style={{
              color: '#000000',
              fontSize: '1.1em',
              letterSpacing: '0.5px',
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>
              Abonează-te
            </span>
          </Button>
        </div>
      </div>
      <div className="hero-card-img">
        <div className="ellipse-bg"></div>
        <img src="/icons/Microphone.png" alt="Microfon" className="hero-icon" />
      </div>
    </div>
  );
}

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
  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <HeroCard />
      </div>

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