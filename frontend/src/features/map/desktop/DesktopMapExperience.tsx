import React, { useState } from 'react';
import { Popup } from 'react-leaflet';
import { Memory } from '@shared/types/types';
import { Heart, Lock, Users, Globe, Calendar, User, Smile, Edit3 } from 'lucide-react';
import { MapCanvas } from '@features/map/shared/MapCanvas';
import { TrackPlayer } from '@/features/memories/shared/TrackPlayer';

interface DesktopMapExperienceProps {
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

export const DesktopMapExperience: React.FC<DesktopMapExperienceProps> = ({
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

  const renderPopup = (memory: Memory) => {
    const hasLiked = likesAndHugs[memory.id]?.liked || false;
    const hasHugged = likesAndHugs[memory.id]?.hugged || false;

    return (
      <Popup 
        autoPan={true} 
        autoPanPaddingTopLeft={[0, 200]}
        eventHandlers={{
          add: () => setOpenPinId(memory.id),
          remove: () => {
            setOpenPinId(prev => prev === memory.id ? null : prev);
          }
        }}
      >
        <div className="memory-popup-card">
          <div className="memory-popup-body">
            <div className="memory-popup-text-column">
              <div className="memory-popup-text">{memory.content}</div>
              <div className="memory-popup-meta">
                <span className="memory-popup-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {memory.privacy_mode === 'private' && <><Lock size={12} /> Günlük</>}
                  {memory.privacy_mode === 'circle' && <><Users size={12} /> Çember</>}
                  {memory.privacy_mode === 'public' && <><Globe size={12} /> Açık</>}
                </span>
                <span className="memory-popup-date" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                  <Calendar size={12} /> {new Date(memory.memory_date).toLocaleDateString('tr-TR')}
                </span>
              </div>

              {memory.tagged_people && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.45rem' }}>
                  {JSON.parse(memory.tagged_people).map((person: string) => (
                    <span 
                      key={person} 
                      style={{ 
                        fontSize: '0.7rem', fontWeight: 600, background: 'rgba(90, 103, 216, 0.08)', color: 'var(--text-active)', 
                        padding: '0.15rem 0.45rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.15rem'
                      }}
                    >
                      <User size={10} /> {person}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {memory.media?.[0]?.url && (
              <div className="memory-popup-image-column">
                <img src={memory.media?.[0]?.url} alt="Memory" className="memory-popup-image" />
              </div>
            )}
          </div>

          {memory.music_track_id && (
            <TrackPlayer trackId={memory.music_track_id} isOpen={openPinId === memory.id} />
          )}

          <div className="memory-popup-actions">
            <button 
              className={`memory-action-btn ${hasLiked ? 'active-like' : ''}`}
              onClick={(e) => {
                triggerReactionAnimation(e);
                onLike(memory.id);
              }}
            >
              <Heart size={14} fill={hasLiked ? 'var(--color-public)' : 'none'} />
              <span>Beğen ({memory.likes_count || 0})</span>
            </button>

            <button 
              className={`memory-action-btn ${hasHugged ? 'active-hug' : ''}`}
              onClick={(e) => {
                triggerReactionAnimation(e);
                onHug(memory.id);
              }}
            >
              <Smile size={14} />
              <span>Sarıl ({memory.hugs_count || 0})</span>
            </button>

            {(memory.id.startsWith('local-') || myCreatedPinIds.includes(memory.id)) && (
              <button 
                className="memory-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPin(memory);
                }}
                style={{ color: 'var(--text-active)' }}
              >
                <Edit3 size={14} />
                <span>Düzenle</span>
              </button>
            )}
          </div>
        </div>
      </Popup>
    );
  };

  return (
    <MapCanvas
      memories={memories}
      isPinningMode={isPinningMode}
      onConfirmPinLocation={onConfirmPinLocation}
      onCancelPinning={onCancelPinning}
      mapRef={mapRef}
      onMarkerClick={(memory) => setOpenPinId(memory.id)}
      renderMarkerPopup={renderPopup}
    >
      {hearts.map(h => (
        <span key={h.id} className="floating-heart" style={{ left: h.x, top: h.y }}>
          ❤️
        </span>
      ))}
    </MapCanvas>
  );
};
