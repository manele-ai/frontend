import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateManeaSong } from '../api';
import { useAuth } from '../components/auth/AuthContext';
import '../styles/HomePage.css';

const STYLES = [
  'Jale ( Guta/Salam Vechi)',
  'De Petrecere ( Bem 7 zile )',
  'Comerciale ( BDLP )',
  'Lautaresti',
  'Muzica Populara',
  'Manele live',
  'De Opulenta',
  'Orientale'
];

export default function HomePage() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [fromName, setFromName] = useState('');
  const [toName, setToName] = useState('');
  const [dedication, setDedication] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [songName, setSongName] = useState('');
  const [songDetails, setSongDetails] = useState('');
  const [wantsDedication, setWantsDedication] = useState(false);
  const [wantsDonation, setWantsDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [mode, setMode] = useState('hard'); // 'hard' sau 'easy'
  
  const navigate = useNavigate();

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setError(null);
  };

  const handleGoToPay = async () => {
    setIsLoading(true);
    setError(null);
    
    if (!user) {
      setError('User not authenticated. Please wait or refresh.');
      setIsLoading(false);
      return;
    }

    try {
      // Call the API with all parameters, using the correct keys for the backend
      const result = await generateManeaSong({ 
        style: selectedStyle, 
        from: fromName, 
        to: toName, 
        dedication,
        title: songName,
        lyricsDetails: songDetails,
        wantsDedication,
        wantsDonation,
        donationAmount,
        mode
      });

      // Save request data and navigate to payment
      const generateRequest = {
        style: selectedStyle,
        songName,
        songDetails,
        from: fromName,
        to: toName,
        dedication,
        wantsDedication,
        wantsDonation,
        donationAmount,
        taskId: result.taskId,
        externalTaskId: result.externalTaskId
      };
      
      localStorage.setItem('pendingGenerateRequest', JSON.stringify(generateRequest));
      navigate('/payment', { state: generateRequest });
    } catch (err) {
      console.error('Error generating song:', err);
      setError(err.message || 'Failed to generate song. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const AuthStatus = () => (
    <div style={{
      position: 'fixed',
      bottom: '40px',
      left: '10px',
      backgroundColor: '#23242b',
      color: '#FFD700',
      padding: '8px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <p>Auth Status:</p>
      {authLoading && <p>Loading...</p>}
      {authError && <p>Error: {authError.message}</p>}
      {user && <p>User: {user.uid} (Anonymous: {user.isAnonymous.toString()})</p>}
      {!user && !authLoading && <p>Not authenticated</p>}
    </div>
  );

  return (
    <div className="home-page">
      <AuthStatus />
      <div className="container">
        <h1 className="title">Manele IO</h1>
        
        <div className="mode-selector">
          <span className={`mode-text ${mode === 'easy' ? 'active' : ''}`}>Easy</span>
          <div className="switch-container">
            <button
              className={`switch-track ${mode === 'hard' ? 'active' : ''}`}
              onClick={() => setMode(mode === 'easy' ? 'hard' : 'easy')}
            >
              <div className={`switch-thumb ${mode === 'hard' ? 'active' : ''}`} />
            </button>
          </div>
          <span className={`mode-text ${mode === 'hard' ? 'active' : ''}`}>Complex</span>
        </div>
        
        <div className="input-group">
          <label className="input-label">Nume piesă</label>
          <input
            className="input"
            type="text"
            placeholder="Nume piesă"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        {mode === 'hard' && (
          <div className="input-group">
            <label className="input-label">Detalii versuri</label>
            <input
              className="input"
              type="text"
              placeholder="Detalii versuri (ex: temă, atmosferă, poveste)"
              value={songDetails}
              onChange={(e) => setSongDetails(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}
        
        <div className="styles-container">
          <label className="input-label">Alege stilul</label>
          <div className="styles-list">
            {STYLES.map((style) => (
              <button
                key={style}
                className={`style-button ${selectedStyle === style ? 'selected' : ''}`}
                onClick={() => handleStyleSelect(style)}
                disabled={isLoading}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
        
        {mode === 'hard' && (
          <>
            <div className="checkbox-group">
              <input
                type="checkbox"
                checked={wantsDedication}
                onChange={(e) => setWantsDedication(e.target.checked)}
                disabled={isLoading}
                id="dedication-checkbox"
              />
              <label htmlFor="dedication-checkbox" className="checkbox-label">
                Vrei dedicație?
              </label>
            </div>
            
            {wantsDedication && (
              <>
                <div className="input-group">
                  <label className="input-label">De la cine?</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="De la cine?"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Pentru cine?</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Pentru cine?"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Dedicatie</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Dedicatie (opțional)"
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                checked={wantsDonation}
                onChange={(e) => setWantsDonation(e.target.checked)}
                disabled={isLoading}
                id="donation-checkbox"
              />
              <label htmlFor="donation-checkbox" className="checkbox-label">
                Vrei să arunci cu bani?
              </label>
            </div>
            
            {wantsDonation && (
              <div className="input-group">
                <label className="input-label">
                  Alege suma pe care vrei sa o arunci la manele si se va specifica in piesa (RON)
                </label>
                <input
                  className="input"
                  type="number"
                  placeholder="Ex: 100 RON"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
          </>
        )}
        
        <button
          className={`button generate-button ${!selectedStyle || isLoading ? 'disabled' : ''}`}
          onClick={handleGoToPay}
          disabled={!selectedStyle || isLoading || authLoading}
        >
          {isLoading || authLoading ? 'Se procesează...' : 'Plateste'}
        </button>
        
        {error && (
          <div className="error-box">
            <p className="error-text">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 