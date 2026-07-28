import React from 'react';
import { User, Heart, ShieldCheck, Share2, Award, PenTool, Calendar } from 'lucide-react';
import { Memory } from '@/shared/types/types';

interface SenPanelProps {
  isOpen: boolean;
  onClose: () => void;
  publicAndCirclePins: Memory[];
  privatePins: Memory[];
  myCreatedPinIds: string[];
  userProfile: { name: string; email: string } | null;
  onEditPin: (memory: Memory) => void;
}

export const SenPanel: React.FC<SenPanelProps> = ({
  isOpen,
  onClose: _onClose,
  publicAndCirclePins,
  privatePins,
  myCreatedPinIds,
  userProfile,
  onEditPin
}) => {
  const privateCount = privatePins.length;
  const publicCount = publicAndCirclePins.filter(p => myCreatedPinIds.includes(p.id) && p.privacy_mode === 'public').length;
  const circleCount = publicAndCirclePins.filter(p => myCreatedPinIds.includes(p.id) && p.privacy_mode === 'circle').length;
  
  const totalLikes = publicAndCirclePins.filter(p => myCreatedPinIds.includes(p.id)).reduce((acc, p) => acc + p.likes_count, 0);
  const totalHugs = publicAndCirclePins.filter(p => myCreatedPinIds.includes(p.id)).reduce((acc, p) => acc + p.hugs_count, 0);

  // Combine user's own memories
  const myMemories = [
    ...privatePins,
    ...publicAndCirclePins.filter(p => myCreatedPinIds.includes(p.id))
  ].sort((a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime());

  return (
    <div className={`mobile-page ${isOpen ? 'open' : ''}`}>
      <h1 className="mobile-large-title">Sen (Profil)</h1>

      <div className="mobile-page-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mobile-spacing-lg)', overflowY: 'auto', height: 'calc(100% - 60px)', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#F1ECE4', borderRadius: '12px', border: '1px dashed rgba(44, 44, 44, 0.18)' }}>
          <div style={{ background: 'var(--text-active)', color: '#ffffff', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>{userProfile ? userProfile.name : 'Anonim Gezgin'}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userProfile ? userProfile.email : 'Oturum açılmadı'}</p>
          </div>
        </div>

        <div>
          <h4 style={{ fontFamily: 'var(--font-ui)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Award size={16} color="var(--text-active)" /> Kampüs Hafıza İstatistiklerim
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div style={{ background: '#F1ECE4', border: '1px dashed rgba(44, 44, 44, 0.15)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-private)', fontFamily: 'var(--font-title)' }}>{privateCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <ShieldCheck size={12} /> Sadece Ben
              </div>
            </div>
            
            <div style={{ background: '#F1ECE4', border: '1px dashed rgba(44, 44, 44, 0.15)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-circle)', fontFamily: 'var(--font-title)' }}>{circleCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <Share2 size={12} /> Çember Anıları
              </div>
            </div>

            <div style={{ background: '#F1ECE4', border: '1px dashed rgba(44, 44, 44, 0.15)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-public)', fontFamily: 'var(--font-title)' }}>{publicCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <Heart size={12} /> Açık Anılar
              </div>
            </div>

            <div style={{ background: '#F1ECE4', border: '1px dashed rgba(44, 44, 44, 0.15)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-active)', fontFamily: 'var(--font-title)' }}>{totalLikes + totalHugs}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <Heart size={12} fill="var(--color-public)" stroke="none" /> Toplam Etkileşim
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontFamily: 'var(--font-ui)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <PenTool size={16} color="var(--text-active)" /> Benim Anılarım ({myMemories.length})
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
            {myMemories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', background: '#fcfcfc', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                Henüz eklediğiniz bir anı bulunmamaktadır. Haritada bir yere tıklayarak ilk anınızı bırakın!
              </div>
            ) : (
              myMemories.map(memory => (
                <div 
                  key={memory.id} 
                  style={{ 
                    background: 'transparent', 
                    borderBottom: '1px dashed rgba(44, 44, 44, 0.15)',
                    borderLeft: `4px solid ${
                      memory.privacy_mode === 'private' ? 'var(--color-private)' : 
                      memory.privacy_mode === 'circle' ? 'var(--color-circle)' : 'var(--color-public)'
                    }`,
                    padding: '0.75rem 0.5rem', 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      padding: '0.15rem 0.4rem', 
                      borderRadius: '6px',
                      background: 
                        memory.privacy_mode === 'private' ? 'rgba(90, 103, 216, 0.1)' : 
                        memory.privacy_mode === 'circle' ? 'rgba(221, 107, 32, 0.1)' : 'rgba(229, 62, 109, 0.1)',
                      color: 
                        memory.privacy_mode === 'private' ? 'var(--color-private)' : 
                        memory.privacy_mode === 'circle' ? 'var(--color-circle)' : 'var(--color-public)'
                    }}>
                      {memory.privacy_mode === 'private' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><ShieldCheck size={11} /> Günlük</span>}
                      {memory.privacy_mode === 'circle' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Share2 size={11} /> Çember</span>}
                      {memory.privacy_mode === 'public' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Heart size={11} fill="var(--color-public)" stroke="none" /> Açık</span>}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={11} /> {new Date(memory.memory_date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: '1.3', wordBreak: 'break-word' }}>
                    {memory.content}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button 
                      onClick={() => onEditPin(memory)}
                      style={{ 
                        background: 'none', 
                        border: '1px solid var(--text-active)', 
                        color: 'var(--text-active)', 
                        padding: '0.25rem 0.65rem', 
                        borderRadius: '8px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--text-active)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'var(--text-active)';
                      }}
                    >
                      Düzenle
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


