import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import '../styles/HomePage.css';

const styles = [
  {
    title: 'JALE',
    subtitle: 'Guta/Salam vechi',
    // image: '/photos/Jale.png',
  },
  {
    title: 'COMERCIALE',
    subtitle: 'BDLP',
    // image: '/photos/Comerciale.png',
  },
  {
    title: 'DE PETRECERE',
    subtitle: 'Bem 7 zile',
    // image: '/photos/Frame 64.png',
  },
  {
    title: 'MUZICA POPULARA',
    subtitle: '',
    // image: '/photos/Frame 63.1.png',
  },
  {
    title: 'MANELE LIVE',
    subtitle: '',
    // image: '/photos/Frame 63.2.png',
  },
  {
    title: 'DE OPULENTA',
    subtitle: '',
    // image: '/photos/Frame 55.png',
  },
  {
    title: 'ORIENTALE',
    subtitle: '',
    // image: '/photos/Orieltala.png',
  },
  {
    title: 'LAUTARESTI',
    subtitle: '',
    // image: '/photos/Frame 63.3.png',
  },
];

function HeroCard() {
  const navigate = useNavigate();
  return (
    <div className="hero-card">
      <div className="hero-card-content">
        <h2 className="hero-title">Genereaza-ti propria manea in cateva minute.</h2>
        <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
        <Button variant="secondary" size="small" className="hero-btn" onClick={() => navigate('/select-style')}>
          <span className="hero-btn-text">Generează acum</span>
        </Button>
      </div>
      <div className="hero-card-img">
        <div className="ellipse-bg"></div>
        <img src="/icons/Microphone.png" alt="Microfon" className="hero-icon" />
      </div>
    </div>
  );
}

function ReusableCard({ background, title, subtitle, buttonText, onButtonClick }) {
  // Extrage URL-ul imaginii din background string
  const imageUrl = background.replace('url(', '').replace(') center/cover no-repeat', '');
  
  return (
    <div 
      className="style-example-card" 
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
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
      <div className="container">
        <HeroCard />
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