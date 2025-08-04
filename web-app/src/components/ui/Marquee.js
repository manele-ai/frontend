import './Marquee.css';

function Marquee() {
  const marqueeText = '🔥 Mihacea Alexandru e smecherul smecherilor 🔥 ';
  return (
    <div className="marquee">
      <div className="marquee-inner">
        <span>{marqueeText.repeat(6)}</span>
        <span>{marqueeText.repeat(6)}</span>
      </div>
    </div>
  );
}

export default Marquee; 