import './Switch.css';

const Switch = ({ 
  checked, 
  onChange, 
  disabled = false, 
  size = 'medium',
  className = '',
  ...props 
}) => {
  const switchClasses = [
    'switch',
    `switch--${size}`,
    checked ? 'switch--checked' : '',
    disabled ? 'switch--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const trackClasses = [
    'switch-track',
    checked ? 'switch-track--checked' : ''
  ].filter(Boolean).join(' ');

  const thumbClasses = [
    'switch-thumb',
    checked ? 'switch-thumb--checked' : ''
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={switchClasses}
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      {...props}
    >
      <div className={trackClasses}>
        <div className={thumbClasses} />
      </div>
    </button>
  );
};

export default Switch; 