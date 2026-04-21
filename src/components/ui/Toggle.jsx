import React from 'react';

const Toggle = ({ value, onChange, disabled = false, className = "" }) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`toggle-track ${value ? "on" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={value}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
    >
      <div className="toggle-thumb" />
    </div>
  );
};

export default Toggle;