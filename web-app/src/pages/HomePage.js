import Button from '../components/ui/Button';
import '../styles/HomePage.css';

const styles = [
  {
    title: 'JALE',
    subtitle: 'Guta/Salam vechi',
    image: '/photos/Frame 55 (1).png',
  },
  {
    title: 'COMERCIALE',
    subtitle: 'BDLP',
    image: '/photos/Frame 63.png',
  },
  {
    title: 'DE PETRECERE',
    subtitle: 'Bem 7 zile',
    image: '/photos/Frame 64.png',
  },
  {
    title: 'MUZICA POPULARA',
    subtitle: '',
    image: '/photos/Frame 63.1.png',
  },
  {
    title: 'MANELE LIVE',
    subtitle: '',
    image: '/photos/Frame 63.2.png',
  },
  {
    title: 'DE OPULENTA',
    subtitle: '',
    image: '/photos/Frame 55.png',
  },
  {
    title: 'ORIENTALE',
    subtitle: '',
    image: '/photos/Frame 64 (1).png',
  },
  {
    title: 'LAUTARESTI',
    subtitle: '',
    image: '/photos/Frame 63.3.png',
  },
];

function HeroCard() {
  return (
    <div className="hero-card">
      <div className="hero-card-content">
        <h2 className="hero-title">Genereaza-ti propria manea in cateva minute.</h2>
        <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
        <Button variant="secondary" size="small" className="hero-btn" onClick={() => {}}>
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

function StyleCard({ title, subtitle, image }) {
  console.log('CARD IMAGE PATH:', image);
  return (
    <div className="style-card" style={{ backgroundImage: `url(${image})` }}>
      <div className="style-card-overlay">
        <div className="style-card-title">{title}</div>
        {subtitle && <div className="style-card-subtitle">{subtitle}</div>}
        <Button variant="secondary" size="small" className="style-card-btn" onClick={() => {}}>Exemple</Button>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="container">
        <HeroCard />
        <div className="styles-grid">
          {styles.map((style, idx) => (
            <StyleCard key={style.title} {...style} />
          ))}
        </div>
      </div>
    </div>
  );
} 