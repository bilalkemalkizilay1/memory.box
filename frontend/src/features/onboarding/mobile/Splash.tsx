import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Soft fade in on mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`mobile-page ${isVisible ? 'open' : ''}`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 'var(--mobile-spacing-xxl)',
        background: 'var(--mobile-bg)'
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          background: 'var(--mobile-accent)', 
          borderRadius: '50%', 
          padding: '16px', 
          marginBottom: '24px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(200, 90, 72, 0.2)'
        }}>
          <Compass size={48} strokeWidth={1.5} />
        </div>
        
        <h1 style={{ 
          fontFamily: 'var(--mobile-font-serif)', 
          fontSize: '36px', 
          fontWeight: 700, 
          color: 'var(--mobile-text-main)',
          marginBottom: '48px',
          letterSpacing: '-0.5px'
        }}>
          memory box
        </h1>
        
        <p style={{ 
          fontFamily: 'var(--mobile-font-serif)', 
          fontSize: '20px', 
          color: 'var(--mobile-text-secondary)',
          textAlign: 'center',
          fontStyle: 'italic',
          maxWidth: '240px',
          lineHeight: 1.4
        }}>
          Every place remembers something.
        </p>
      </div>

      <div style={{ width: '100%', paddingBottom: 'var(--mobile-spacing-lg)' }}>
        <button 
          className="mobile-button mobile-button-primary"
          onClick={onComplete}
        >
          Başlayalım
        </button>
      </div>
    </div>
  );
};
