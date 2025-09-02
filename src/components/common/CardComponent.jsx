import React from 'react';
import './CardComponent.css';

const CardComponent = ({ 
  title = '루틴 제목',
  details = '월/수/금 · 45분',
  buttonText = '시작',
  onClick,
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`card ${className} ${disabled ? 'card--disabled' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="card__content">
        <h3 className="card__title">{title}</h3>
        <p className="card__details">{details}</p>
      </div>
      <button 
        className="card__button"
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default CardComponent;
