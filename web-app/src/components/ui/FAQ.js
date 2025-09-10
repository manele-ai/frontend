import { useState } from 'react';
import { faqQuestions } from '../../data/faqData';
import './FAQ.css';

const FAQ = () => {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="faq">
      <div className="faq-header">
        <h2 className="faq-title">Întrebări Frecvente</h2>
        <p className="faq-subtitle">
          Găsește răspunsuri la cele mai comune întrebări despre generarea de manele
        </p>
      </div>
      
      <div className="faq-items">
        {faqQuestions.map((item) => (
          <div key={item.id} className="faq-item">
            <button 
              className={`faq-question ${openItems.has(item.id) ? 'open' : ''}`}
              onClick={() => toggleItem(item.id)}
            >
              <span className="question-text">{item.question}</span>
              <div className="question-icon">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>
            
            <div className={`faq-answer ${openItems.has(item.id) ? 'open' : ''}`}>
              <div className="answer-content">
                <p>{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
