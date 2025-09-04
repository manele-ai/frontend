import { useEffect, useRef } from 'react';

const TextInput = ({
    value = '',
    onChange,
    placeholder = '',
    maxLength = 100,
    maxHeightInLines = 5,
    className = '',
    error = false,
    showCharCounter = true,
    allowNewlines = true,
    spellCheck = false,
    lang = 'ro',
    ...props
}) => {
    const textareaRef = useRef(null);
    const lockedRef = useRef(false); // tracks "hit max once, keep height"

    const handleChange = (e) => {
        const newValue = e.target.value;
        let filteredValue = newValue;

        if (!allowNewlines) {
            filteredValue = newValue.replace(/\n/g, '');
        } else {
            filteredValue = newValue.replace(/\n\n+/g, '\n');
        }

        onChange(filteredValue);
    };

    const handleInput = () => {
        requestAnimationFrame(adjustHeight);
    };

    const getLineHeightPx = (el) => {
        const cs = window.getComputedStyle(el);
        const lh = parseFloat(cs.lineHeight);
        if (!Number.isNaN(lh)) return lh;
        // fallback when line-height is "normal"
        const fontSize = parseFloat(cs.fontSize) || 16;
        return fontSize * 1.2;
    };

    const adjustHeight = () => {
        const ta = textareaRef.current;
        if (!ta) return;

        const lineHeight = getLineHeightPx(ta);
        const maxPx = Math.round(lineHeight * maxHeightInLines);

        // ensure sizing is predictable
        ta.style.boxSizing = 'border-box';

        // Reset height to measure correctly, then cap by lines
        ta.style.height = 'auto';
        const needed = ta.scrollHeight;
        const newHeight = Math.min(needed, maxPx);
        ta.style.height = `${newHeight}px`;

        const hitMax = needed > maxPx - 1; // small tolerance
        if (hitMax) {
            lockedRef.current = true;
            ta.style.minHeight = `${maxPx}px`; // lock at max height
            ta.style.overflowY = 'auto';
        } else {
            // Only allow shrinking if we haven't locked yet
            if (!lockedRef.current) ta.style.minHeight = '0px';
            ta.style.overflowY = 'hidden';
        }
    };

    // Adjust on value changes; also reset lock if cleared
    useEffect(() => {
        if ((value ?? '').trim() === '') {
            lockedRef.current = false;
            const ta = textareaRef.current;
            if (ta) {
                ta.style.minHeight = '0px';
                ta.style.height = 'auto';
                ta.style.overflowY = 'hidden';
            }
        }
        requestAnimationFrame(adjustHeight);
    }, [value]);

    return (
        <>
            <textarea
                ref={textareaRef}
                className={`${error ? 'error' : ''} ${className}`}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onInput={handleInput}
                maxLength={maxLength}
                rows={1}
                style={{
                    resize: 'none',
                    overflow: 'hidden', // will be toggled to auto when capped
                    ...props.style,
                }}
                {...props}
            />
            {showCharCounter && (
                <div className="char-counter">{value.length}/{maxLength}</div>
            )}
        </>
    );
};

export default TextInput;
