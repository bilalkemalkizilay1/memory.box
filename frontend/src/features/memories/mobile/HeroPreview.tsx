import React from 'react';
import { COPY } from '@/shared/constants/microcopy';
import { ExtractionStatus } from '@/shared/hooks/useMemoryCreation';
import { CheckCircle } from 'lucide-react';

interface HeroPreviewProps {
  status: ExtractionStatus;
  photoUrl: string | null;
}

export const HeroPreview: React.FC<HeroPreviewProps> = ({ status, photoUrl }) => {
  if (status === 'idle') return null;

  return (
    <div className="hero-preview-overlay">
      <div 
        className="hero-preview-background" 
        style={{ backgroundImage: photoUrl ? `url(${photoUrl})` : 'none' }}
      ></div>
      <div className="hero-preview-content">
        {photoUrl && (
          <img src={photoUrl} alt="Memory Preview" className="hero-preview-image" />
        )}
        
        <div className="hero-preview-status-container">
          <div className={`hero-status-item ${status !== 'idle' ? 'active' : ''}`}>
            {status === 'reading_photo' ? <span className="spinner">⏳</span> : <CheckCircle size={16} color="#4ade80" />}
            <p>{COPY.heroPreparing}</p>
          </div>
          
          <div className={`hero-status-item ${['finding_location', 'success', 'error'].includes(status) ? 'active' : ''}`}>
            {status === 'finding_location' ? <span className="spinner">📍</span> : <CheckCircle size={16} color="#4ade80" />}
            <p>{status === 'finding_location' ? COPY.heroFindingLocation : COPY.heroLocationFound}</p>
          </div>

          <div className={`hero-status-item ${['success', 'error'].includes(status) ? 'active' : ''}`}>
            <CheckCircle size={16} color="#4ade80" />
            <p>{COPY.heroDateFound}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
