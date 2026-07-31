import React, { useState } from 'react';
import { Compass, Camera } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="mobile-page open" style={{ background: 'var(--mobile-bg)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Step 1: Welcome */}
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--mobile-spacing-xxl)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px' }}>
            <div style={{ 
              background: 'var(--mobile-accent)', borderRadius: '50%', padding: '12px', color: 'white', marginBottom: '16px' 
            }}>
              <Compass size={32} />
            </div>
            <h2 style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '24px', fontWeight: 700 }}>memory box</h2>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '32px', textAlign: 'center', lineHeight: 1.2 }}>
              A place where<br/>moments<br/>become places.
            </h1>
          </div>
          <button className="mobile-button mobile-button-primary" onClick={nextStep}>İleri</button>
        </div>
      )}

      {/* Step 2: Where is your favorite place? */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--mobile-spacing-xxl)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '20px', fontWeight: 600, color: 'var(--mobile-text-secondary)', marginBottom: '24px' }}>memory box</h2>
            <h1 style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '32px', textAlign: 'center', lineHeight: 1.1 }}>
              Where is your<br/>favorite place?
            </h1>
          </div>
          <div style={{ flex: 1, position: 'relative', borderRadius: '24px', overflow: 'hidden', background: '#e0e0e0', marginBottom: '24px' }}>
            <img src="https://unpkg.com/leaflet@1.9.4/images/marker-icon.png" alt="pin" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', zIndex: 10 }} />
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
              <input type="text" className="mobile-input" placeholder="Moda Sahili, İstanbul" readOnly onClick={nextStep} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: First Memory Drop */}
      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--mobile-spacing-xxl)' }}>
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--mobile-accent)', borderRadius: '50%', padding: '12px', color: 'white', marginBottom: '16px' }}>
              <Camera size={24} />
            </div>
            <h2 style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '20px', fontWeight: 600 }}>memory box</h2>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <div style={{ width: '100%', aspectRatio: '1/1', background: '#F5F2EC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--mobile-text-tertiary)' }}>
               <Camera size={48} />
             </div>
             <div style={{ background: 'var(--mobile-surface)', padding: '16px', borderRadius: '16px', width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <p style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '18px', color: 'var(--mobile-text-main)', lineHeight: 1.4 }}>
                  Watching the sunset over the Bosphorus with old friends. A perfect moment.
                </p>
             </div>
          </div>
          <button className="mobile-button mobile-button-primary" style={{ marginTop: '24px' }} onClick={nextStep}>İleri</button>
        </div>
      )}

      {/* Step 4: Permissions (Photos) */}
      {step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--mobile-spacing-xxl)', background: 'linear-gradient(to bottom, #d6ccc2, var(--mobile-bg))' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ background: 'var(--mobile-surface)', padding: '32px 24px', borderRadius: '24px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
               <h1 style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '28px', marginBottom: '16px' }}>Preserve Your Story</h1>
               <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '16px', color: 'var(--mobile-text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
                 To keep your memories safe and organized by place, Memory Box needs access to your photo library.
               </p>
               <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '14px', color: 'var(--mobile-text-main)', fontWeight: 500 }}>
                 Your privacy comes first, always.
               </p>
            </div>
          </div>
          <div style={{ paddingBottom: '16px' }}>
             <h3 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Allow Access to Photos?</h3>
             <button className="mobile-button mobile-button-secondary" style={{ marginBottom: '12px' }} onClick={onComplete}>Don't Allow</button>
             <button className="mobile-button mobile-button-primary" onClick={onComplete}>Allow Full Access</button>
          </div>
        </div>
      )}

    </div>
  );
};
