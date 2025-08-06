import "./ProfileCard.css";

const ProfileCard = () => (
  <div className="card-container" style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
    <img
      src="/icons/profile-card/_CARD.svg"
      alt="Credit Card"
      className="card-base"
      style={{ width: '100%', height: 'auto' }}
    />

    {/* Top-right logo */}
    <img
      src="/icons/profile-card/LOGO.svg"
      alt="Logo"
      className="card-logo"
      style={{ position: 'absolute', top: '10%', right: '10%', width: '20%' }}
    />

    {/* Top-left title */}
    <div className="card-title" style={{ position: 'absolute', top: '10%', left: '10%' }}>Manelist</div>

    {/* Mid-card icons, arranged horizontally */}
    <div className="card-icons" style={{ 
      position: 'absolute',
      top: '60%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', 
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '80%'
    }}>
      <img src="/icons/profile-card/CREDITE.svg" alt="Credite" style={{ width: '18%', height: 'auto' }} />
      <img src="/icons/profile-card/MANELE.svg" alt="Manele" style={{ width: '18%', height: 'auto' }} />
      <img src="/icons/profile-card/DEDICATII.svg" alt="Dedicatii" style={{ width: '18%', height: 'auto' }} />
      <img src="/icons/profile-card/BANI ARUNCATI.svg" alt="Bani Aruncati" style={{ width: '18%', height: 'auto' }} />
    </div>

    {/* Bottom-left user name */}
    <div className="card-username" style={{ position: 'absolute', bottom: '10%', left: '10%' }}>User name</div>
  </div>
);

export default ProfileCard;
