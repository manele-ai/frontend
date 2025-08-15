import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadString } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadFile } from 'utils';
import { useAuth } from '../components/auth/AuthContext';
import SongItem from '../components/SongItem';
import { styles } from '../data/stylesData';
import { useSongs } from '../hooks/useSongs';
import { db, storage } from '../services/firebase';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfile, loading, signOut } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || user?.providerData?.[0]?.displayName || user?.displayName || '',
    email: user?.email || ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarWebpDataUrl, setAvatarWebpDataUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { songs, loading: songsLoading, loadingMore, error: songsError, hasMore, loadMoreSongs } = useSongs();
  const [activeSong, setActiveSong] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user?.uid) {
        setUserData(null);
        return;
      }
      try {
        const userRef = doc(db, 'usersPublic', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserData(userData);
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error('Error checking subscription status:', err);
      }
    };

    checkSubscriptionStatus();
  }, [user]);

  // Close edit modal on Escape key
  useEffect(() => {
    if (!isEditing) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isEditing]);

  useEffect(() => {
    if (userData) {
      setFormData(prevState => ({
        ...prevState,
        displayName: userData.displayName || userProfile?.displayName || user?.displayName || user?.providerData?.[0]?.displayName || prevState.displayName
      }));
    }
  }, [userData]);

  // Filtrare piese după stil
  const filteredSongs = selectedStyle === 'all'
    ? songs
    : songs.filter(song => song.userGenerationInput?.style === selectedStyle);

  const handlePlayPause = (song) => {
    if (activeSong?.id === song.id) {
      setActiveSong(null);
    } else {

      setActiveSong(song);
    }
  };

  const handleDownload = async (song) => {
    try {
      const rawUrl = song.storage?.url || song.apiData?.audioUrl || song.apiData?.streamAudioUrl;
      if (!rawUrl) {
        throw new Error('No download URL available');
      }

      let resolvedUrl = rawUrl;
      if (resolvedUrl.startsWith('gs://')) {
        const ref = storageRef(storage, resolvedUrl);
        resolvedUrl = await getDownloadURL(ref);
      }

      await downloadFile(resolvedUrl, `${song.apiData?.title || 'manea'}.mp3`);
    } catch (err) {
      console.error('Error downloading song:', err);
      alert('Eroare la descărcarea melodiei');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const MAX_AVATAR_BYTES = 300 * 1024; // 300 KB limit
  const MAX_DIMENSION = 512; // resize to fit within 512x512
  const WEBP_QUALITY = 0.8; // 80% quality for good balance

  const processImageToWebp = async (file) => {
    // Validate type
    if (!file.type.startsWith('image/')) {
      throw new Error('Te rugăm să alegi un fișier imagine.');
    }

    // Load into Image
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Nu s-a putut citi fișierul.'));
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Nu s-a putut încărca imaginea.'));
      image.src = dataUrl;
    });

    // Compute target size while preserving aspect ratio
    const { width, height } = img;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    // Draw to canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Export as WebP with target quality, possibly try reducing quality to pass size cap
    let quality = WEBP_QUALITY;
    let webpDataUrl = canvas.toDataURL('image/webp', quality);

    const dataUrlToBytes = (du) => {
      const base64 = (du.split(',')[1] || '');
      const padding = (base64.match(/=+$/) || [''])[0].length;
      return Math.ceil((base64.length * 3) / 4) - padding;
    };

    // If bigger than limit, iteratively reduce quality
    let attempts = 0;
    while (dataUrlToBytes(webpDataUrl) > MAX_AVATAR_BYTES && attempts < 5) {
      quality = Math.max(0.4, quality - 0.1);
      webpDataUrl = canvas.toDataURL('image/webp', quality);
      attempts += 1;
    }

    if (dataUrlToBytes(webpDataUrl) > MAX_AVATAR_BYTES) {
      throw new Error('Imaginea este prea mare după compresie. Te rugăm să alegi o imagine mai mică.');
    }

    return webpDataUrl;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setAvatarError('');

    try {
      const webpDataUrl = await processImageToWebp(file);
      setAvatarWebpDataUrl(webpDataUrl);
      setAvatarPreview(webpDataUrl);
    } catch (err) {
      console.error(err);
      setAvatarError(err.message || 'Eroare la procesarea imaginii.');
      setAvatarWebpDataUrl(null);
      setAvatarPreview(null);
    }
  };

  const uploadAvatarAndGetUrl = async (dataUrl) => {
    if (!user?.uid) throw new Error('Neautentificat');
    const path = `avatars/${user.uid}.webp`;
    const avatarRef = storageRef(storage, path);
    // Upload as data_url so contentType is preserved
    await uploadString(avatarRef, dataUrl, 'data_url');
    const url = await getDownloadURL(avatarRef);
    return url;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');
    setAvatarError('');

    try {
      let photoURLToSave = undefined;
      if (avatarWebpDataUrl) {
        try {
          photoURLToSave = await uploadAvatarAndGetUrl(avatarWebpDataUrl);
        } catch (uploadErr) {
          console.error(uploadErr);
          setAvatarError(uploadErr.message || 'Eroare la încărcarea imaginii.');
          setSaveLoading(false);
          return; // stop saving if avatar upload failed
        }
      }

      await updateUserProfile({
        displayName: formData.displayName,
        ...(photoURLToSave ? { photoURL: photoURLToSave } : {}),
      });
      setIsEditing(false);

      // Update locally to dislay new name if all went well
      setUserData(prevState => ({
        ...prevState,
        displayName: formData.displayName
      }));
    } catch (err) {
      setError(err.message || 'Eroare la salvarea profilului');
    } finally {
      setSaveLoading(false);
    }
  };

  const onEditProfileClick = () => {
    setIsEditing(true);
    setFormData(prevState => ({
      ...prevState,
      displayName: userData?.displayName || userProfile?.displayName || user?.displayName || user?.providerData?.[0]?.displayName || ''
    }));
  };

  const handleCancel = () => {
    setFormData({
      displayName: userData?.displayName || userProfile?.displayName || user?.displayName || user?.providerData?.[0]?.displayName || '',
      email: user?.email || ''
    });
    setAvatarWebpDataUrl(null);
    setAvatarPreview(null);
    setAvatarError('');
    setIsEditing(false);
    setError('');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div 
        className="profile-page"
        style={{
          backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
          backgroundSize: '30%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      >
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Se încarcă profilul...</p>
        </div>
      </div>
    );
  }

  const displayInitial = (userProfile?.displayName || user?.email || 'U').charAt(0).toUpperCase();
  const displayName = userData?.displayName || 'Utilizator';

  return (
    <div 
      className="profile-page"
      style={{
        backgroundImage: 'url(/backgrounds/patternFudalSecond.svg)',
        backgroundSize: '30%',
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat',
      }}
    >
      <div className="container">
        {/* Redesigned profile header */}
        <div className="profile-header">
          <div className="profile-avatar profile-avatar-large">
            {userData?.photoURL ? (
              <img 
                src={avatarPreview || userData.photoURL} 
                alt=""
                className="avatar-image avatar-image-large"
              />
            ) : (
              <>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={displayName}
                    className="avatar-image avatar-image-large"
                  />
                ) : (
                  <div className="avatar-placeholder avatar-placeholder-large">
                    {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </>
            )}
            {userData?.isSubscribed ? (
              <div className="vip-badge" title="Abonament activ">
                💎 VIP
              </div>
            ) : (
              <div className="unsubscribed-badge" title="Abonament inactiv">
                👑
              </div>
            )}
          </div>

          <div className="profile-info">
                          <div className="profile-user-details">
                <div className="profile-username gold-text">{user?.displayName || user?.providerData?.[0]?.displayName || 'User Anonim'}</div>
                <div className="profile-email-text gold-text">{user?.email || user?.providerData?.[0]?.phoneNumber}</div>
                <div className="profile-mini-actions">
                  <div className="action-wrapper">
                    <a className="edit-profile-button" href="https://billing.stripe.com/p/login/9B6dR9cOp84R5xRfmK6oo00" target="_blank" rel="noopener noreferrer">Abonamentul meu</a>
                  </div>
                  <div className="action-wrapper">
                    <button className="edit-profile-button" onClick={onEditProfileClick}>Editeaza profilul</button>
                  </div>
                  <div className="action-wrapper">
                    <button className="text-link soft-red-text" onClick={handleLogout}>Log Out</button>
                  </div>
                </div>
            </div>
          </div>

          <div className="profile-stats-grid">
            <div className="stat-item">
              <span className="stat-number gold-text" title="Le poti folosi oricand in aplicatie">
                {userData?.creditsBalance || 0}
              </span>
              <span className="stat-label">Credite piese</span>
            </div>
            <div className="stat-item">
              <span className="stat-number gold-text">{userData?.stats?.numSongsGenerated || 0}</span>
              <span className="stat-label">Piese generate</span>
            </div>
            <div className="stat-item">
              <span className="stat-number gold-text">{userData?.stats?.numDedicationsGiven || 0}</span>
              <span className="stat-label">Dedicatii</span>
            </div>
            <div className="stat-item">
              <span className="stat-number gold-text">{userData?.stats?.sumDonationsTotal || 0} RON</span>
              <span className="stat-label">Bani la lautar</span>
            </div>
          </div>
        </div>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
      {/* Card cu piesele generate de user */}
      <div className="profile-songs-card">
        {/* Bara de filtre stiluri */}
        <div className="song-styles-filter">
          <button
            className={`style-filter-btn${selectedStyle === 'all' ? ' active' : ''}`}
            onClick={() => setSelectedStyle('all')}
          >
            Toate manelele
          </button>
          {styles.map((style) => (
            <button
              key={style.value}
              className={`style-filter-btn${selectedStyle === style.value ? ' active' : ''}`}
              onClick={() => setSelectedStyle(style.value)}
            >
              {style.title.charAt(0) + style.title.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {songsLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Se încarcă melodiile...</p>
          </div>
        ) : songsError ? (
          <div className="error-message">{songsError}</div>
        ) : (
          <div className="profile-song-list">
            {filteredSongs.length > 0 ? (
              filteredSongs.map((song) => (
                <div className="profile-song-card" key={song.id}>
                  <div className="profile-song-content">
                    <SongItem
                      song={song}
                      isActive={activeSong?.id === song.id}
                      onPlayPause={handlePlayPause}
                      onDownload={handleDownload}
                      styleLabel={styles.find(s => s.value === song.userGenerationInput?.style)?.title || song.userGenerationInput?.style}
                    />
                    <div className="profile-song-actions">
                      {song.storage?.url || song.apiData?.audioUrl ? (
                      <button
                        type="button"
                        className="download-button"
                        onClick={() => handleDownload(song)}
                        aria-label="Descarcă melodia"
                      >
                        Descarcă
                      </button>
                      ) : (
                        <div className="download-button-disabled" aria-label="Piesa este în curs de generare">
                          <span className="inline-spinner-gold" aria-hidden="true"></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-songs">
                <p>Nu există piese pentru acest stil.</p>
              </div>
            )}
            
            {/* Buton pentru încărcarea mai multor piese */}
            {hasMore && filteredSongs.length > 0 && (
              <div className="load-more-container">
                <button
                  className="load-more-button"
                  onClick={loadMoreSongs}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <span className="inline-spinner-gold"></span>
                      Se încarcă...
                    </>
                  ) : (
                    'Încarcă mai multe piese'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="profile-button-container">
            <button
              className="action-button hero-btn"
              onClick={() => navigate('/select-style')}
            >
              <span className="hero-btn-text">Generează manea</span>
            </button>
      </div>

      {isEditing && (
        <div className="modal-overlay" onClick={handleCancel} role="dialog" aria-modal="true">
            <div className="profile-actions" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSave} className="edit-form">
                <button
                  type="button"
                  aria-label="Închide"
                  className="modal-close-btn"
                  onClick={handleCancel}
                >
                  ×
                </button>

                <div className="form-group">
                  <label htmlFor="displayName">Nume</label>
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

                {/* Avatar uploader (drag & drop) */}
                <div className="form-group">
                  <label>Poză profil</label>
                  <div
                    className={`avatar-dropzone${isDragging ? ' active' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleAvatarChange({ target: { files: [f] } }); }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Previzualizare avatar" className="avatar-image avatar-image-large" />
                    ) : (
                      <div className="dropzone-desc">
                        <span>Trage și plasează aici imaginea</span>
                        <small>Sau folosește butonul de mai jos</small>
                      </div>
                    )}
                  </div>
                  {avatarError && (
                    <div className="upload-error">{avatarError}</div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <div className="dropzone-actions">
                    <button
                      type="button"
                      className="edit-profile-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saveLoading}
                    >
                      Alege un fișier
                    </button>
                  </div>
                </div>

                <div className="form-actions single">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={saveLoading}
                  >
                    {saveLoading ? 'Se salvează...' : 'Salvează'}
                  </button>
                </div>
              </form>
            </div>
        </div>
      )}
    </div>
  );
} 