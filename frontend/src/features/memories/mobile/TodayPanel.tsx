import React from 'react';
import { Compass, Camera, MapPin, Music } from 'lucide-react';
import { Memory } from '@/shared/types/types';

interface TodayPanelProps {
  isOpen: boolean;
  onClose: () => void;
  todayPins: Memory[];
  onPinClick: (memory: Memory) => void;
  onAddClick: () => void;
}

export const TodayPanel: React.FC<TodayPanelProps> = ({
  isOpen,
  todayPins,
  onPinClick,
  onAddClick
}) => {
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date().toLocaleDateString('tr-TR', options).toUpperCase();
  };

  const getFormattedTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('tr-TR', options);
  };

  return (
    <div className={`mobile-page ${isOpen ? 'open' : ''}`} style={{ background: 'var(--mobile-bg)' }}>
      
      <div className="mobile-page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--mobile-spacing-lg) var(--mobile-spacing-lg) 100px' }}>
        
        {/* Header */}
        <div style={{ marginTop: 'calc(var(--mobile-safe-top) + 20px)', marginBottom: '32px' }}>
          <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '13px', fontWeight: 600, color: 'var(--mobile-text-secondary)', letterSpacing: '0.5px', marginBottom: '8px' }}>
            {getFormattedDate()}
          </p>
          <h1 className="mobile-large-title" style={{ marginTop: 0, padding: 0, marginBottom: 0 }}>
            Bugün nasıldı?
          </h1>
        </div>

        {/* Content */}
        {todayPins.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '24px' }}>
               <div style={{ background: 'rgba(200, 90, 72, 0.1)', borderRadius: '50%', padding: '32px' }}>
                 <Compass size={48} color="var(--mobile-accent)" strokeWidth={1} style={{ opacity: 0.8 }} />
               </div>
            </div>
            
            <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '16px', color: 'var(--mobile-text-secondary)', textAlign: 'center', lineHeight: 1.5, marginBottom: '32px' }}>
              Bugünün anısı henüz yazılmadı.<br/>
              Yeni bir anı ekleyerek gününü başlat.
            </p>

            <button 
              className="mobile-button mobile-button-primary" 
              onClick={onAddClick}
              style={{ width: '100%' }}
            >
              Bugünden bir kare seç
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
              {todayPins.map((memory, index) => (
                <React.Fragment key={memory.id}>
                  {index > 0 && <hr style={{ border: 'none', borderTop: '1px solid var(--mobile-border)', margin: 0 }} />}
                  
                  <div 
                    onClick={() => onPinClick(memory)}
                    style={{ display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#e0e0e0', overflow: 'hidden', flexShrink: 0 }}>
                      {memory.media && memory.media[0]?.url ? (
                        <img src={memory.media[0].url} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'var(--mobile-accent)' }}>
                          <Camera size={24} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                      <p style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '18px', fontWeight: 600, color: 'var(--mobile-text-main)', margin: 0, padding: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {memory.content || "İsimsiz Anı"}
                      </p>
                      <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '14px', color: 'var(--mobile-text-secondary)', margin: 0, padding: 0 }}>
                        {getFormattedTime(memory.memory_date)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div style={{ marginTop: 'auto' }}>
               <button 
                  className="mobile-button mobile-button-secondary" 
                  onClick={onAddClick}
                  style={{ width: '100%', background: 'transparent', border: '1px solid var(--mobile-accent)' }}
                >
                  + Bugünden bir kare seç
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
