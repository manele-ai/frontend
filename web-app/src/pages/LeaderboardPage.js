import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeaderboardData } from '../hooks/useLeaderboardData';
import '../styles/LeaderboardPage.css';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('songs');
  const { data, loading, error } = useLeaderboardData();

  const getActiveData = () => {
    switch (activeTab) {
      case 'songs':
        return data.songs;
      case 'dedications':
        return data.dedications;
      case 'donations':
        return data.donations;
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
              {activeTab === 'songs' && <td>{user.numSongsGenerated}</td>}
              {activeTab === 'dedications' && <td>{user.numDedicationsGiven}</td>}
              {activeTab === 'donations' && <td>{user.sumDonationsTotal} RON</td>}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="leaderboard-page">
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        ← Înapoi
      </button>

      <div className="container">
        <h1 className="title">Clasament</h1>
        
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => setActiveTab('songs')}
          >
            Piese Generate
          </button>
          <button 
            className={`tab-button ${activeTab === 'dedications' ? 'active' : ''}`}
            onClick={() => setActiveTab('dedications')}
          >
            Dedicații
          </button>
          <button 
            className={`tab-button ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            Donații
          </button>
        </div>

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
    </div>
  );
} 