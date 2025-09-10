import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import './ScrollAnimation.css';

const ScrollAnimation = ({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up',
  duration = 0.6
}) => {
  const [elementRef, isVisible] = useScrollAnimation({
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
    triggerOnce: true
  });

  const animationClass = `scroll-animation scroll-animation--${direction} ${
    isVisible ? 'scroll-animation--visible' : ''
  } ${className}`;

  const style = {
    '--animation-delay': `${delay}s`,
    '--animation-duration': `${duration}s`
  };

  return (
    <div 
      ref={elementRef}
      className={animationClass}
      style={style}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation;
