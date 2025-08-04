import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useLeaderboardData } from '../hooks/useLeaderboardData';
import '../styles/LeaderboardPage.css';

function HeroCardLeaderboard() {
  const navigate = useNavigate();
  return (
    <div className="hero-card leaderboard-hero-card">
      <div className="hero-card-content">
        <h2 className="hero-title">Topul manelistilor</h2>
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

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('songs');
  const [timeframe, setTimeframe] = useState('allTime'); // 'allTime' or 'today'
  const { data, loading, error } = useLeaderboardData();

  const getActiveData = () => {
    const timeframeData = data[timeframe];
    console.log('Timeframe data:', timeframeData);
    switch (activeTab) {
      case 'songs':
        return timeframeData.songs;
      case 'dedications':
        return timeframeData.dedications;
      case 'donations':
        return timeframeData.donations;
      default:
        return [];
    }
  };

  const renderTableContent = () => {
    const activeData = getActiveData();
    
    return (
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            {activeTab === 'songs' && <th>Songs Generated</th>}
            {activeTab === 'dedications' && <th>Dedications Made</th>}
            {activeTab === 'donations' && <th>Total Donations</th>}
          </tr>
        </thead>
        <tbody>
          {activeData.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td className="user-cell">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span>{user.displayName}</span>
              </td>
              {activeTab === 'songs' && <td>{user.count || 0}</td>}
              {activeTab === 'dedications' && <td>{user.count || 0}</td>}
              {activeTab === 'donations' && <td>{user.count || 0} RON</td>}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div 
      className="leaderboard-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Hero Section copiată din HomePage, ca un card separat */}
      <div className="hero-section leaderboard-hero-section">
        <HeroCardLeaderboard />
      </div>
      
      {/* Butoanele de filtrare în exterior, cu design ca în ProfilePage */}
      <div className="leaderboard-filters">
        <div className="timeframe-tabs">
          <button 
            className={`filter-btn ${timeframe === 'allTime' ? 'active' : ''}`}
            onClick={() => setTimeframe('allTime')}
          >
            Din totdeauna
          </button>
          <button 
            className={`filter-btn ${timeframe === 'today' ? 'active' : ''}`}
            onClick={() => setTimeframe('today')}
          >
            Astăzi
          </button>
        </div>

        <div className="category-tabs">
          <button 
            className={`filter-btn ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => setActiveTab('songs')}
          >
            Piese Generate
          </button>
          <button 
            className={`filter-btn ${activeTab === 'dedications' ? 'active' : ''}`}
            onClick={() => setActiveTab('dedications')}
          >
            Dedicații
          </button>
          <button 
            className={`filter-btn ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            Donații
          </button>
        </div>
      </div>
      
      {/* Cardul de clasament ca componentă separată */}
      <div className="leaderboard-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Se încarcă clasamentul...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          renderTableContent()
        )}
      </div>
    </div>
  );
} 