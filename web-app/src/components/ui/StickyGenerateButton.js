import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StickyGenerateButton.css';

export default function StickyGenerateButton() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if it's desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 769);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    // Scroll listener
    const handleScroll = () => {
      if (isDesktop) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        setIsVisible(scrollTop > 200); // Show after 200px scroll
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isDesktop]);

  const handleClick = () => {
    navigate('/select-style');
  };

  if (!isDesktop) return null;

  return (
    <button
      className={`sticky-generate-btn ${isVisible ? 'visible' : ''}`}
      onClick={handleClick}
      aria-label="Genereaza manea"
    >
      <span className="sticky-generate-text">GENEREAZA</span>
    </button>
  );
}
