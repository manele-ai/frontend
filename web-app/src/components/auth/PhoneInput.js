import { useEffect, useRef } from 'react';

export function PhoneInput({ value, onChange, error, autoFocus }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const normalizePhoneNumber = (input) => {
    // Remove all non-digit characters
    let digits = input.replace(/\D/g, '');
    
    // Handle different prefixes
    if (digits.startsWith('40')) {
      // Remove the 40 prefix
      digits = digits.slice(2);
    }
    
    // Remove leading zero if present
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    
    // Validate length (should be 9 digits for Romanian numbers)
    if (digits.length > 9) {
      digits = digits.slice(0, 9);
    }
    
    // Add the standard +40 prefix
    return '+40' + digits;
  };

  const handleChange = (e) => {
    let phoneNumber = e.target.value;
    
    // Normalize the phone number
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    
    onChange({
      target: {
        name: 'phoneNumber',
        value: normalizedNumber
      }
    });
  };

  // Remove the +40 prefix for display
  // If the value doesn't start with +40, try to normalize it first
  const displayValue = value.startsWith('+40') 
    ? value.slice(3) 
    : normalizePhoneNumber(value).slice(3);

  return (
    <div className="input-group">
      <div className="phone-input-group">
        <div className="country-prefix">
          <span style={{ fontSize: '16px' }}>🇷🇴</span>
          <span>+40</span>
        </div>
        <input
          type="tel"
          name="phoneNumber"
          placeholder="712 345 678"
          value={displayValue}
          onChange={handleChange}
          className={`auth-input phone-input ${error ? 'auth-input-error' : ''}`}
          required
          ref={inputRef}
          maxLength="9"
        />
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
} 