import './Input.css';

const Input = ({ 
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  error,
  className = '',
  ...props 
}) => {
  const inputClasses = [
    'input-field',
    error ? 'input-field--error' : '',
    disabled ? 'input-field--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-container">
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <input
        type={type}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      {error && (
        <span className="input-error">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input; 