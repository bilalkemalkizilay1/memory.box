import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, MapPin, Music, Edit3, Share, Trash2 } from 'lucide-react';
import { Memory } from '@/shared/types/types';

interface MemoryExperienceProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
  onEdit: (memory: Memory) => void;
  onDelete: (memoryId: string) => void;
}

export const MemoryExperience: React.FC<MemoryExperienceProps> = ({
  isOpen,
  onClose,
  memory,
  onEdit,
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Reset states when opened/closed
  useEffect(() => {
    setShowMenu(false);
    setShowDeleteConfirm(false);
  }, [isOpen]);

  if (!isOpen || !memory) return null;

  const hasPhoto = memory.photos && memory.photos.length > 0;
  const photoUrl = hasPhoto ? memory.photos[0] : (memory.media?.[0]?.url || null);
  
  // Format Date: e.g. "28 Temmuz 2026"
  const formattedDate = new Date(memory.memory_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Tagged People parsing
  let parsedPeople: string[] = [];
  try {
    if (memory.tagged_people) {
      parsedPeople = JSON.parse(memory.tagged_people);
    }
  } catch (e) {
    console.error('Failed to parse tagged people', e);
  }

  const handleDelete = () => {
    onDelete(memory.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className={`mobile-page ${isOpen ? 'open' : ''}`} style={{ zIndex: 2000, background: 'var(--mobile-bg)', overflowY: 'auto', display: 'block' }}>
      
      {/* Absolute Header - Back & More Actions */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: 'calc(var(--mobile-safe-top) + 16px) var(--mobile-spacing-lg) 16px', zIndex: 10 }}>
        <button onClick={onClose} style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mobile-text-main)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mobile-text-main)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <MoreHorizontal size={24} />
          </button>

          {/* Overflow Menu */}
          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowMenu(false)} />
              <div style={{ position: 'absolute', top: '48px', right: 0, background: 'var(--mobile-surface)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', width: '200px', zIndex: 20, overflow: 'hidden' }}>
                <div 
                  onClick={() => { setShowMenu(false); onEdit(memory); }}
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--mobile-text-main)', borderBottom: '1px solid var(--mobile-border)' }}
                >
                  <Edit3 size={18} /> <span style={{ fontFamily: 'var(--mobile-font)', fontSize: '15px', fontWeight: 500 }}>Düzenle</span>
                </div>
                <div 
                  onClick={() => { setShowMenu(false); alert('Paylaşım yakında...'); }}
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--mobile-text-main)', borderBottom: '1px solid var(--mobile-border)' }}
                >
                  <Share size={18} /> <span style={{ fontFamily: 'var(--mobile-font)', fontSize: '15px', fontWeight: 500 }}>Paylaş</span>
                </div>
                <div 
                  onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--mobile-accent)' }}
                >
                  <Trash2 size={18} /> <span style={{ fontFamily: 'var(--mobile-font)', fontSize: '15px', fontWeight: 500 }}>Sil</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes subtleZoom {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-hero { animation: subtleZoom 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-story { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.15s; opacity: 0; }
        .animate-meta { animation: fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: 0.3s; opacity: 0; }
      `}</style>

      {/* Hero Image (Top 50%) */}
      {photoUrl && (
        <div className="animate-hero" style={{ width: '100%', height: '50vh', position: 'relative', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px', overflow: 'hidden', zIndex: 1, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <img src={photoUrl} alt="Memory Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Content Area */}
      <div style={{ padding: '32px var(--mobile-spacing-lg) 100px', zIndex: 2, position: 'relative' }}>
        
        {/* Title & Date */}
        <div className="animate-story" style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--mobile-text-main)', margin: '0 0 8px 0', lineHeight: 1.2 }}>
            {memory.content.substring(0, 30)}{memory.content.length > 30 ? '...' : ''} {/* Mock title if not separated */}
          </h1>
          <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '14px', color: 'var(--mobile-text-secondary)', margin: 0 }}>
            {formattedDate}
          </p>
        </div>

        {/* Story */}
        <div className="animate-story" style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '18px', color: 'var(--mobile-text-main)', lineHeight: 1.6, margin: 0 }}>
            {memory.content}
          </p>
        </div>

        {/* Tagged People */}
        {parsedPeople.length > 0 && (
          <div className="animate-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--mobile-surface)', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--mobile-border)' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mobile-text-main)' }}>{parsedPeople.length} Kişi</span>
            </div>
            {parsedPeople.map((person, i) => (
              <span key={i} style={{ fontSize: '14px', color: 'var(--mobile-text-secondary)' }}>{person}{i < parsedPeople.length - 1 ? ',' : ''}</span>
            ))}
          </div>
        )}

        {/* Metadata Pills */}
        <div className="animate-meta" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--mobile-surface)', padding: '10px 16px', borderRadius: '12px', width: 'fit-content' }}>
            <MapPin size={16} color="var(--mobile-accent)" />
            <span style={{ fontFamily: 'var(--mobile-font)', fontSize: '14px', fontWeight: 500, color: 'var(--mobile-text-main)' }}>Moda Sahil Parkı, Kadıköy</span>
          </div>
          {memory.music_track_id && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--mobile-surface)', padding: '10px 16px', borderRadius: '12px', width: 'fit-content' }}>
              <Music size={16} color="var(--mobile-text-secondary)" />
              <span style={{ fontFamily: 'var(--mobile-font)', fontSize: '14px', fontWeight: 500, color: 'var(--mobile-text-main)' }}>Teoman - İstanbul'da Sonbahar</span>
            </div>
          )}
        </div>

        {/* Mini Map (Optional bottom map) */}
        {memory.lat && memory.lng && (
           <div className="animate-meta" style={{ width: '100%', height: '120px', borderRadius: '24px', background: '#e0e0e0', position: 'relative', overflow: 'hidden' }}>
             {/* Mock map for now since MapContainer can conflict inside modals easily. We can add static map image or minimal map here later */}
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px', background: 'var(--mobile-accent)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }} />
             <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center', fontSize: '12px', color: 'var(--mobile-text-secondary)', fontWeight: 600 }}>Moda Sahili</div>
           </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--mobile-surface)', width: '85%', maxWidth: '320px', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
             <Trash2 size={32} color="var(--mobile-accent)" />
             <p style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '18px', textAlign: 'center', color: 'var(--mobile-text-main)', margin: 0 }}>
               Bu anıyı kaldırmak istediğine emin misin?
             </p>
             <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
               <button onClick={() => setShowDeleteConfirm(false)} className="mobile-button" style={{ flex: 1, background: '#f0f0f0', color: 'var(--mobile-text-main)' }}>Vazgeç</button>
               <button onClick={handleDelete} className="mobile-button" style={{ flex: 1, background: 'var(--mobile-accent)', color: 'white' }}>Kaldır</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};
