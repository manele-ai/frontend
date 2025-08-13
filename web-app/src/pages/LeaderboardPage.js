import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import Button from '../components/ui/Button';
import { useLeaderboardData } from '../hooks/useLeaderboardData';
import '../styles/LeaderboardPage.css';

function HeroCardLeaderboard() {
  const navigate = useNavigate();
  return (
    <div className="hero-card">
      <div className="hero-card-content">
        <h2 className="hero-title">Topul manelistilor</h2>
        <p className="hero-subtitle">Genereaza-ti propria manea in cateva minute cu ajutorul aplicatiei noastre.</p>
        <Button className="hero-btn hero-section-button" onClick={() => navigate('/generate')}>
          <span className="hero-btn-text">Generează acum</span>
        </Button>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('songs');
  const [timeframe, setTimeframe] = useState('allTime'); // 'allTime' or 'today'
  const { data, loading, error } = useLeaderboardData();
  const { user } = useAuth();

  // Function to find current user's rank
  const getCurrentUserRank = () => {
    if (!user) return null;
    
    const timeframeData = data[timeframe];
    if (!timeframeData) return null;
    
    let allUsersData;
    switch (activeTab) {
      case 'songs':
        allUsersData = timeframeData.songs;
        break;
      case 'dedications':
        allUsersData = timeframeData.dedications;
        break;
      case 'donations':
        allUsersData = timeframeData.donations;
        break;
      default:
        return null;
    }
    
    if (!allUsersData || allUsersData.length === 0) return null;
    
    // Find user's position in the full list (not just top 10)
    const userIndex = allUsersData.findIndex(userData => userData.id === user.uid);
    
    if (userIndex === -1) return null;
    
    return {
      rank: userIndex + 1,
      userData: allUsersData[userIndex]
    };
  };

  const currentUserRank = getCurrentUserRank();

  const getActiveData = () => {
    const timeframeData = data[timeframe];
    
    let activeData;
    switch (activeTab) {
      case 'songs':
        activeData = timeframeData.songs;
        break;
      case 'dedications':
        activeData = timeframeData.dedications;
        break;
      case 'donations':
        activeData = timeframeData.donations;
        break;
      default:
        activeData = [];
    }
    
    // Return only the top 10 users
    const top10Data = activeData ? activeData.slice(0, 10) : [];
    return top10Data;
  };

  const renderTableContent = () => {
    const activeData = getActiveData();
    
    if (!activeData || activeData.length === 0) {
      return (
        <div className="no-data-message">
          <p>Nu există date pentru această categorie.</p>
        </div>
      );
    }
    
    return (
      <>
        {/* Current User Rank Section */}
        {currentUserRank && (
          <div className="current-user-rank">
            <div className="current-user-rank-content">
              <div className="current-user-rank-info">
                <div className="current-user-rank-avatar">
                  {currentUserRank.userData.photoURL ? (
                    <img 
                      src={currentUserRank.userData.photoURL} 
                      alt={currentUserRank.userData.displayName} 
                      className="current-user-avatar" 
                    />
                  ) : (
                    <div className="current-user-avatar-placeholder">
                      {currentUserRank.userData.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="current-user-rank-details">
                  <span className="current-user-rank-label">Rankul tău</span>
                  <span className="current-user-rank-position">#{currentUserRank.rank}</span>
                  <span className="current-user-rank-name">{currentUserRank.userData.displayName}</span>
                  <span className="current-user-rank-value">
                    {activeTab === 'songs' && `${currentUserRank.userData.count} piese`}
                    {activeTab === 'dedications' && `${currentUserRank.userData.count} dedicații`}
                    {activeTab === 'donations' && `${currentUserRank.userData.count} RON`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Leaderboard Table */}
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
                <div className="user-cell-container">
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
                </div>
                {activeTab === 'songs' && <td>{user.count || 0}</td>}
                {activeTab === 'dedications' && <td>{user.count || 0}</td>}
                {activeTab === 'donations' && <td>{user.count || 0} RON</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </>
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
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-section-overlay"></div>
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
      <div className="leaderboard-button-container">
        <Button className="hero-btn hero-section-button" onClick={() => navigate('/generate')}>
          <span className="hero-btn-text">Generează acum</span>
        </Button>
      </div>
    </div>
  );
} 