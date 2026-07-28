import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Memory } from '@shared/types/types';
import { Heart, Lock, Users, Globe, Calendar, User, Smile, Edit3 } from 'lucide-react';
import { MapCanvas } from '@features/map/shared/MapCanvas';
import { TrackPlayer } from '@/features/memories/shared/TrackPlayer';
import { COPY } from '@/shared/constants/microcopy';

interface MapComponentProps {
  memories: Memory[];
  isPinningMode: boolean;
  onConfirmPinLocation: (lat: number, lng: number) => void;
  onCancelPinning: () => void;
  onLike: (id: string) => Promise<void>;
  onHug: (id: string) => Promise<void>;
  likesAndHugs: Record<string, { liked: boolean; hugged: boolean }>;
  mapRef: React.MutableRefObject<any>;
  myCreatedPinIds: string[];
  onEditPin: (memory: Memory) => void;
}

export const MobileMapExperience: React.FC<MapComponentProps> = ({
  memories,
  isPinningMode,
  onConfirmPinLocation,
  onCancelPinning,
  onLike,
  onHug,
  likesAndHugs,
  mapRef,
  myCreatedPinIds,
  onEditPin
}) => {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [openPinId, setOpenPinId] = useState<string | null>(null);
  const [selectedMobilePin, setSelectedMobilePin] = useState<Memory | null>(null);

  const triggerReactionAnimation = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    const id = Date.now() + Math.random();
    
    setHearts(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 800);
  };

  return (
    <MapCanvas
      memories={memories}
      isPinningMode={isPinningMode}
      onConfirmPinLocation={onConfirmPinLocation}
      onCancelPinning={onCancelPinning}
      mapRef={mapRef}
      onMarkerClick={(memory) => {
        setSelectedMobilePin(memory);
        setOpenPinId(memory.id);
      }}
    >
      {hearts.map(h => (
        <span key={h.id} className="floating-heart" style={{ left: h.x, top: h.y }}>
          ❤️
        </span>
      ))}

      {selectedMobilePin && (() => {
        const memory = selectedMobilePin;
        const hasLiked = likesAndHugs[memory.id]?.liked || false;
        const hasHugged = likesAndHugs[memory.id]?.hugged || false;

        return ReactDOM.createPortal(
          <div className="mobile-bottom-sheet-overlay" onClick={() => {
            setSelectedMobilePin(null);
            setOpenPinId(null);
          }}>
            <div className="mobile-bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
              <div className="bottom-sheet-drag-handle" onClick={() => {
                setSelectedMobilePin(null);
                setOpenPinId(null);
              }}></div>
              
              <div className="memory-popup-card" style={{ transform: 'none', padding: 0, boxShadow: 'none', border: 'none', background: 'transparent' }}>
                <div className="memory-popup-body" style={{ flexDirection: 'column', gap: '1rem' }}>
                  <div className="memory-popup-text-column">
                    <div className="memory-popup-text" style={{ maxHeight: 'none', fontSize: '1.25rem' }}>{memory.content}</div>
                    
                    <div className="memory-popup-meta" style={{ flexDirection: 'row', gap: '1rem', flexWrap: 'wrap' }}>
                      <span className="memory-popup-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        {memory.privacy_mode === 'private' && <><Lock size={12} /> {COPY.privacyPrivateTag}</>}
                        {memory.privacy_mode === 'circle' && <><Users size={12} /> {COPY.privacyCircleTag}</>}
                        {memory.privacy_mode === 'public' && <><Globe size={12} /> {COPY.privacyPublicTag}</>}
                      </span>
                      <span className="memory-popup-date" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={12} /> {new Date(memory.memory_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    {memory.tagged_people && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.65rem' }}>
                        {JSON.parse(memory.tagged_people).map((person: string) => (
                          <span 
                            key={person} 
                            style={{ 
                              fontSize: '0.72rem', fontWeight: 600, background: 'rgba(90, 103, 216, 0.08)', color: 'var(--text-active)', 
                              padding: '0.2rem 0.6rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.15rem'
                            }}
                          >
                            <User size={10} /> {person}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {memory.media?.[0]?.url && (
                    <div className="memory-popup-image-column" style={{ width: '100%', height: '200px' }}>
                      <img 
                        src={memory.media?.[0]?.url} 
                        alt="Memory" 
                        className="memory-popup-image" 
                        style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                {memory.music_track_id && (
                  <TrackPlayer trackId={memory.music_track_id} isOpen={openPinId === memory.id} />
                )}

                <div className="memory-popup-actions" style={{ marginTop: '1.5rem', justifyContent: 'space-around' }}>
                  <button 
                    className={`memory-action-btn ${hasLiked ? 'active-like' : ''}`}
                    onClick={(e) => {
                      triggerReactionAnimation(e);
                      onLike(memory.id);
                    }}
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}
                  >
                    <Heart size={16} fill={hasLiked ? 'var(--color-public)' : 'none'} />
                    <span>Beğen ({memory.likes_count || 0})</span>
                  </button>

                  <button 
                    className={`memory-action-btn ${hasHugged ? 'active-hug' : ''}`}
                    onClick={(e) => {
                      triggerReactionAnimation(e);
                      onHug(memory.id);
                    }}
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}
                  >
                    <Smile size={16} />
                    <span>Sarıl ({memory.hugs_count || 0})</span>
                  </button>

                  {(memory.id.startsWith('local-') || myCreatedPinIds.includes(memory.id)) && (
                    <button 
                      className="memory-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMobilePin(null);
                        setOpenPinId(null);
                        onEditPin(memory);
                      }}
                      style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', flex: 1, justifyContent: 'center', color: 'var(--text-active)' }}
                    >
                      <Edit3 size={16} />
                      <span>Düzenle</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </MapCanvas>
  );
};
