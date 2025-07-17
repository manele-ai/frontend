import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfile, loading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    email: user?.email || ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');

    try {
      await updateUserProfile({
        displayName: formData.displayName
      });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Eroare la salvarea profilului');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă profilul...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Butonul de Înapoi eliminat */}
      <div className="container">
        <div className="profile-content">
          <div className="profile-avatar">
            {userProfile?.photoURL ? (
              <img 
                src={userProfile.photoURL} 
                alt={userProfile.displayName}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {userProfile?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          
          <h2 className="profile-name">
            {userProfile?.displayName || user?.displayName || 'Utilizator'}
          </h2>
          
          <p className="profile-email">{user?.email}</p>
          
          <p className="profile-joined">
            Membru din {userProfile?.createdAt ? 
              new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('ro-RO') : 
              'recent'
            }
          </p>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{userProfile?.songIds?.length || 0}</span>
              <span className="stat-label">Piese generate</span>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div className="quick-actions">
            <button
              className="action-button hero-btn"
              onClick={() => setIsEditing(true)}
            >
              <span className="hero-btn-text">Editează profilul</span>
            </button>
            
            <button
              className="action-button hero-btn"
              onClick={() => navigate('/select-style')}
            >
              <span className="hero-btn-text">Generează manea</span>
            </button>
          </div>
        ) : (
          <div className="profile-actions">
            <form onSubmit={handleSave} className="edit-form">
              <div className="form-group">
                <label htmlFor="displayName">Nume afișat</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="form-input disabled"
                />
                <small>Email-ul nu poate fi modificat</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cancel-button hero-btn"
                  disabled={saveLoading}
                >
                  <span className="hero-btn-text">Anulează</span>
                </button>
                <button
                  type="submit"
                  className="save-button hero-btn"
                  disabled={saveLoading}
                >
                  <span className="hero-btn-text">{saveLoading ? 'Se salvează...' : 'Salvează'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 