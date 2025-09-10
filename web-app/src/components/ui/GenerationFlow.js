import React from 'react';
import { useNavigate } from 'react-router-dom';
import { generationFlowSteps } from '../../data/generationFlowData';
import Button from './Button';
import './GenerationFlow.css';

const GenerationFlow = () => {
  const steps = generationFlowSteps;
  const navigate = useNavigate();

  const handleGenerateClick = () => {
    navigate('/generate');
  };

  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'edit':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
      case 'robot':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
          </svg>
        );
      case 'music':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        );
      case 'download':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="generation-flow">
      <div className="generation-flow-header">
        <h2 className="generation-flow-title">Cum funcționează generarea?</h2>
        <p className="generation-flow-subtitle">
          În doar 4 pași simpli, ai propria manea personalizată
        </p>
      </div>
      
      <div className="generation-flow-steps">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="generation-step-card">
              <div className="step-number">{step.number}</div>
              <div className="step-icon">{renderIcon(step.icon)}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
            
            {index < steps.length - 1 && (
              <div className="step-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M9 18L15 12L9 6" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Call to Action */}
      <div className="generation-flow-cta">
        <h3 className="cta-title">Gata să îți creezi maneaua?</h3>
        <p className="cta-subtitle">Începe acum procesul de generare în doar câteva click-uri!</p>
        <Button 
          className="cta-button"
          onClick={handleGenerateClick}
        >
          <span className="cta-button-text">GENEREAZĂ MANEAUA ACUM</span>
        </Button>
      </div>
    </div>
  );
};

export default GenerationFlow;
