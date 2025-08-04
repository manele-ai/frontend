import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SongItem from '../components/SongItem';
import Button from '../components/ui/Button';
import { styles } from '../data/stylesData';
import '../styles/ExemplePage.css';

// Datele pentru exemplele de piese (în viitor vor fi încărcate din Firebase)
const exampleSongs = {
  jale: [
    {
      id: 'jale-1',
      apiData: {
        title: 'Jale și durere',
        imageUrl: '/photos/Jale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'jale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'jale-2',
      apiData: {
        title: 'Inima mea plânge',
        imageUrl: '/photos/Jale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'jale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'jale-3',
      apiData: {
        title: 'Sufletul meu e trist',
        imageUrl: '/photos/Jale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'jale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'jale-4',
      apiData: {
        title: 'Lacrimi de durere',
        imageUrl: '/photos/Jale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'jale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'jale-5',
      apiData: {
        title: 'Inima mea e ruptă',
        imageUrl: '/photos/Jale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'jale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    }
  ],
  comerciale: [
    {
      id: 'comerciale-1',
      apiData: {
        title: 'BDLP la maxim',
        imageUrl: '/photos/Comerciale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'comerciale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'comerciale-2',
      apiData: {
        title: 'Comerciale de top',
        imageUrl: '/photos/Comerciale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'comerciale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'comerciale-3',
      apiData: {
        title: 'Hits comerciale',
        imageUrl: '/photos/Comerciale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'comerciale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'comerciale-4',
      apiData: {
        title: 'Comerciale de succes',
        imageUrl: '/photos/Comerciale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'comerciale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'comerciale-5',
      apiData: {
        title: 'BDLP hits',
        imageUrl: '/photos/Comerciale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'comerciale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    }
  ],
  petrecere: [
    {
      id: 'petrecere-1',
      apiData: {
        title: 'Bem 7 zile',
        imageUrl: '/photos/Petrecere.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'petrecere' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'petrecere-2',
      apiData: {
        title: 'Petrecere la maxim',
        imageUrl: '/photos/Petrecere.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'petrecere' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'petrecere-3',
      apiData: {
        title: 'Hai să bem',
        imageUrl: '/photos/Petrecere.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'petrecere' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'petrecere-4',
      apiData: {
        title: 'Petrecere fără sfârșit',
        imageUrl: '/photos/Petrecere.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'petrecere' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'petrecere-5',
      apiData: {
        title: 'Bem și dansăm',
        imageUrl: '/photos/Petrecere.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'petrecere' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    }
  ],
  populare: [
    {
      id: 'populare-1',
      apiData: {
        title: 'Muzică populară',
        imageUrl: '/photos/Populare.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'populare' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'populare-2',
      apiData: {
        title: 'Muzică tradițională',
        imageUrl: '/photos/Populare.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'populare' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'populare-3',
      apiData: {
        title: 'Muzică de neam',
        imageUrl: '/photos/Populare.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'populare' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'populare-4',
      apiData: {
        title: 'Muzică populară veche',
        imageUrl: '/photos/Populare.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'populare' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'populare-5',
      apiData: {
        title: 'Muzică de țară',
        imageUrl: '/photos/Populare.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'populare' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    }
  ],
  live: [
    {
      id: 'live-1',
      apiData: {
        title: 'Manel live',
        imageUrl: '/photos/Live.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'live' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'live-2',
      apiData: {
        title: 'Concert live',
        imageUrl: '/photos/Live.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'live' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'live-3',
      apiData: {
        title: 'Manel în direct',
        imageUrl: '/photos/Live.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'live' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'live-4',
      apiData: {
        title: 'Spectacol live',
        imageUrl: '/photos/Live.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'live' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'live-5',
      apiData: {
        title: 'Manel live la maxim',
        imageUrl: '/photos/Live.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'live' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    }
  ],
  opulenta: [
    {
      id: 'opulenta-1',
      apiData: {
        title: 'De opulență',
        imageUrl: '/photos/Opulenta.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'opulenta' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'opulenta-2',
      apiData: {
        title: 'Opulență și lux',
        imageUrl: '/photos/Opulenta.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'opulenta' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'opulenta-3',
      apiData: {
        title: 'De lux și opulență',
        imageUrl: '/photos/Opulenta.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'opulenta' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'opulenta-4',
      apiData: {
        title: 'Opulență maximă',
        imageUrl: '/photos/Opulenta.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'opulenta' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'opulenta-5',
      apiData: {
        title: 'De opulență și lux',
        imageUrl: '/photos/Opulenta.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'opulenta' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    }
  ],
  orientale: [
    {
      id: 'orientale-1',
      apiData: {
        title: 'Orientale',
        imageUrl: '/photos/Orientale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'orientale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'orientale-2',
      apiData: {
        title: 'Muzică orientală',
        imageUrl: '/photos/Orientale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'orientale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'orientale-3',
      apiData: {
        title: 'Orientale vechi',
        imageUrl: '/photos/Orientale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'orientale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'orientale-4',
      apiData: {
        title: 'Muzică orientală veche',
        imageUrl: '/photos/Orientale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'orientale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'orientale-5',
      apiData: {
        title: 'Orientale de neam',
        imageUrl: '/photos/Orientale.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'orientale' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    }
  ],
  lautaresti: [
    {
      id: 'lautaresti-1',
      apiData: {
        title: 'Lăutărești',
        imageUrl: '/photos/Lautaresti.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'lautaresti' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'lautaresti-2',
      apiData: {
        title: 'Muzică lăutărească',
        imageUrl: '/photos/Lautaresti.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'lautaresti' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'lautaresti-3',
      apiData: {
        title: 'Lăutărești vechi',
        imageUrl: '/photos/Lautaresti.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'lautaresti' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'lautaresti-4',
      apiData: {
        title: 'Muzică lăutărească veche',
        imageUrl: '/photos/Lautaresti.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'lautaresti' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    },
    {
      id: 'lautaresti-5',
      apiData: {
        title: 'Lăutărești de neam',
        imageUrl: '/photos/Lautaresti.jpeg',
        audioUrl: '/music/mohanveena-indian-guitar-374179.mp3'
      },
      userGenerationInput: { style: 'lautaresti' },
      storage: { url: '/music/mohanveena-indian-guitar-374179.mp3' }
    }
  ]
};

function HeroCardExemple({ style }) {
  const navigate = useNavigate();
  const selectedStyle = styles.find(s => s.value === style);
  
  return (
    <div className="hero-card">
      <div className="hero-card-content">
        <h2 className="hero-title">Exemple de {selectedStyle?.title?.toLowerCase()}</h2>
        <p className="hero-subtitle">Ascultă exemple de piese din stilul {selectedStyle?.title?.toLowerCase()} și inspiră-te pentru propria ta manea.</p>
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

export default function ExemplePage() {
  const [searchParams] = useSearchParams();
  const [activeSong, setActiveSong] = useState(null);
  const style = searchParams.get('style') || 'jale';
  
  const songs = exampleSongs[style] || exampleSongs.jale;
  const selectedStyle = styles.find(s => s.value === style);

  const handlePlayPause = (song) => {
    if (activeSong?.id === song.id) {
      setActiveSong(null);
    } else {
      setActiveSong(song);
    }
  };

  const handleDownload = async (song) => {
    try {
      const downloadUrl = song.storage?.url || song.apiData?.audioUrl;
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${song.apiData?.title || 'manea'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading song:', err);
      alert('Eroare la descărcarea melodiei');
    }
  };

  return (
    <div 
      className="exemple-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Hero Section */}
      <div className="hero-section">
        <HeroCardExemple style={style} />
      </div>

      {/* Songs Card */}
      <div className="exemple-songs-card">
        <div className="exemple-song-list">
          {songs.map((song) => (
            <SongItem
              key={song.id}
              song={song}
              isActive={activeSong?.id === song.id}
              onPlayPause={handlePlayPause}
              onDownload={handleDownload}
              styleLabel={selectedStyle?.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 