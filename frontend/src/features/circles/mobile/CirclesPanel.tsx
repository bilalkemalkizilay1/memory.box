import React, { useState } from 'react';
import { Link2, Plus, ChevronRight, Users } from 'lucide-react';
import { Circle } from '@/shared/types/types';
import { createCircle, fetchCircle } from '@/shared/api/api';

interface CirclesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  joinedCircles: Circle[];
  setJoinedCircles: React.Dispatch<React.SetStateAction<Circle[]>>;
  selectedCircleId: string | null;
  setSelectedCircleId: (id: string | null) => void;
}

export const CirclesPanel: React.FC<CirclesPanelProps> = ({
  isOpen,
  onClose: _onClose,
  joinedCircles,
  setJoinedCircles,
  selectedCircleId,
  setSelectedCircleId
}) => {
  const [error, setError] = useState<string | null>(null);

  // In a real app, these would open modals/bottom sheets to enter text.
  // For MVP, we can keep the simple prompt logic or just a simplified view.
  const handleCreateClick = async () => {
    const name = prompt('Yeni Çember Adı:');
    if (!name) return;
    try {
      const newCircle = await createCircle(name);
      setJoinedCircles(prev => [...prev, newCircle]);
      setSelectedCircleId(newCircle.id);
    } catch (err) {
      setError('Oluşturulamadı.');
    }
  };

  const handleJoinClick = async () => {
    const code = prompt('6 Haneli Çember Kodu:');
    if (!code) return;
    try {
      const circle = await fetchCircle(code.toUpperCase());
      setJoinedCircles(prev => [...prev, circle]);
      setSelectedCircleId(circle.id);
    } catch (err) {
      setError('Geçersiz kod.');
    }
  };

  return (
    <div className={`mobile-page ${isOpen ? 'open' : ''}`} style={{ background: 'var(--mobile-bg)' }}>
      
      <div className="mobile-page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--mobile-safe-top) 0 100px' }}>
        
        {/* Header */}
        <div style={{ padding: '20px var(--mobile-spacing-lg) 16px' }}>
          <h1 className="mobile-large-title" style={{ margin: 0, padding: 0 }}>Çemberler</h1>
        </div>

        {error && (
          <div style={{ margin: '0 var(--mobile-spacing-lg) 16px', color: 'var(--mobile-accent)', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Actions (Apple Settings Style) */}
        <div className="mobile-list" style={{ margin: '0 var(--mobile-spacing-lg) 32px' }}>
           <div className="mobile-list-item" onClick={handleCreateClick} style={{ padding: '16px 0', borderBottom: '1px solid var(--mobile-border)' }}>
              <div style={{ background: 'var(--mobile-surface)', borderRadius: '8px', padding: '6px', color: 'var(--mobile-accent)' }}>
                 <Plus size={20} />
              </div>
              <div className="mobile-list-content">
                <div className="mobile-list-title" style={{ fontSize: '17px' }}>Yeni Çember Oluştur</div>
              </div>
           </div>

           <div className="mobile-list-item" onClick={handleJoinClick} style={{ padding: '16px 0' }}>
              <div style={{ background: 'var(--mobile-surface)', borderRadius: '8px', padding: '6px', color: 'var(--mobile-accent)' }}>
                 <Link2 size={20} />
              </div>
              <div className="mobile-list-content">
                <div className="mobile-list-title" style={{ fontSize: '17px' }}>Davet Koduyla Katıl</div>
              </div>
           </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--mobile-border)', margin: '0 var(--mobile-spacing-lg) 32px' }} />

        {/* My Circles */}
        <div style={{ padding: '0 var(--mobile-spacing-lg)' }}>
          <h2 style={{ fontFamily: 'var(--mobile-font)', fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
            Çemberlerin
          </h2>

          {joinedCircles.length === 0 ? (
            <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(200, 90, 72, 0.1)', borderRadius: '50%', padding: '24px', marginBottom: '16px' }}>
                 <Users size={32} color="var(--mobile-accent)" style={{ opacity: 0.8 }} />
              </div>
              <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '15px', color: 'var(--mobile-text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
                Henüz paylaşılan bir anı yok.<br/>Bir çember oluştur veya katıl.
              </p>
            </div>
          ) : (
            <div className="mobile-list">
              {joinedCircles.map(circle => {
                const isSelected = selectedCircleId === circle.id;
                return (
                  <div 
                    key={circle.id} 
                    className="mobile-list-item"
                    onClick={() => setSelectedCircleId(isSelected ? null : circle.id)}
                    style={{ padding: '16px 0', borderBottom: '1px solid var(--mobile-border)' }}
                  >
                    <div className="mobile-list-content">
                      <div className="mobile-list-title" style={{ fontSize: '17px', color: isSelected ? 'var(--mobile-accent)' : 'var(--mobile-text-main)' }}>
                        {circle.name}
                      </div>
                    </div>
                    <ChevronRight size={20} color="var(--mobile-text-tertiary)" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
