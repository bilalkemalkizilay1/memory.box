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
  onAddClick: () => void;
  onPinClick: (memory: Memory) => void;
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
  onEditPin,
  onAddClick,
  onPinClick
}) => {
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Filter today's memories for the bottom sheet
  const todaysMemories = memories.filter(p => new Date(p.memory_date).toDateString() === new Date().toDateString());

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
        onPinClick(memory);
      }}
    >
      {hearts.map(h => (
        <span key={h.id} className="floating-heart" style={{ left: h.x, top: h.y }}>
          ❤️
        </span>
      ))}

      {/* Persistent Map Bottom Sheet */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--mobile-surface)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        padding: '24px var(--mobile-spacing-lg) 100px', // padding bottom for bottom nav
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
        zIndex: 400
      }}>
        <div style={{ width: '40px', height: '4px', background: '#E5E0D8', borderRadius: '4px', margin: '0 auto 16px' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <MapPin size={18} color="var(--mobile-accent)" />
          <h2 style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '18px', fontWeight: 600, color: 'var(--mobile-text-main)', margin: 0 }}>Bugün</h2>
        </div>

        <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '15px', color: 'var(--mobile-text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
          {todaysMemories.length === 0 
            ? "Bugün henüz bir anı bırakmadın." 
            : `Bugün ${todaysMemories.length} anın var. Devam etmek ister misin?`}
        </p>

        <button 
          className="mobile-button mobile-button-primary"
          onClick={onAddClick}
          style={{ width: '100%' }}
        >
          + Bugünden bir kare seç
        </button>
      </div>

    </MapCanvas>
  );
};
