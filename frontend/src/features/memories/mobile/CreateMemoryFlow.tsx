import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { X, Music, User, Lock, Edit3 } from 'lucide-react';
import { Circle, Memory } from '@/shared/types/types';
import * as api from '@/shared/api/api';
import toast from 'react-hot-toast';
import { COPY } from '@/shared/constants/microcopy';

interface CreateMemoryFlowProps {
  isOpen: boolean;
  onClose: () => void;
  joinedCircles: Circle[];
  existingPeople: string[];
  onSubmit: (data: {
    content: string;
    privacy_mode: 'public' | 'circle' | 'private';
    circle_id: string | null;
    memory_date: string;
    images: File[];
    music_track_id: string | null;
    tagged_people: string | null;
  }) => Promise<Memory>;
  prefilledPhotos: File[];
  prefilledPhotoPreviews: string[];
  prefilledCoords: { lat: number; lng: number } | null;
  prefilledDate: string | null;
  prefilledAddress: string | null;
}

const modalMarkerIcon = L.divIcon({
  className: 'custom-pin-marker-modal',
  html: `<div class="pin-stamp" style="background-color: var(--color-private); width: 24px; height: 24px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

type Step = 'STAGE_1' | 'STAGE_2';

export const CreateMemoryFlow: React.FC<CreateMemoryFlowProps> = ({
  isOpen,
  onClose,
  joinedCircles,
  onSubmit,
  prefilledPhotos,
  prefilledPhotoPreviews,
  prefilledCoords,
  prefilledDate,
  prefilledAddress,
}) => {
  const [step, setStep] = useState<Step>('STAGE_1');
  
  const [content, setContent] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'public' | 'circle' | 'private'>('private');
  const [circleId, setCircleId] = useState<string | null>(joinedCircles[0]?.id || null);
  
  const [songQuery, setSongQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<{ id: string, title: string, artist: string } | null>(null);

  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [savedMemoryId, setSavedMemoryId] = useState<string | null>(null);
  
  const defaultCoords = prefilledCoords || { lat: 41.028, lng: 29.000 };
  const defaultDate = prefilledDate || new Date().toISOString().substring(0, 10);

  useEffect(() => {
    if (isOpen) {
      setStep('STAGE_1');
      const draft = localStorage.getItem('memory_draft');
      setContent(draft || '');
      setPrivacyMode('private');
      setSavedMemoryId(null);
      setSongQuery('');
      setSearchResults([]);
      setSelectedMusic(null);
      setTaggedPeople([]);
    }
  }, [isOpen]);

  const handleContentChange = (val: string) => {
    setContent(val);
    localStorage.setItem('memory_draft', val);
  };

  const handleSaveMemory = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const memoryPromise = onSubmit({
        content: content.trim() || 'Yeni Anı',
        privacy_mode: privacyMode,
        circle_id: privacyMode === 'circle' ? circleId : null,
        memory_date: defaultDate,
        images: prefilledPhotos,
        music_track_id: selectedMusic ? selectedMusic.id : null,
        tagged_people: taggedPeople.length > 0 ? JSON.stringify(taggedPeople) : null
      });

      toast.promise(memoryPromise, {
        loading: 'Anınız zaman kapsülüne ekleniyor...',
        success: '✨ Harika! Anınız başarıyla kaydedildi.',
        error: 'Kaydedilirken bir hata oluştu.'
      });

      const memory = await memoryPromise;
      localStorage.removeItem('memory_draft');
      setSavedMemoryId(memory.id);
      setStep('STAGE_2');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSongs = async () => {
    if (!songQuery.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(songQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateEnrichments = async () => {
    if (!savedMemoryId) return onClose();
    try {
      await api.updateMemory(savedMemoryId, {
        content,
        memory_date: defaultDate,
        privacy_mode: privacyMode,
        circle_id: privacyMode === 'circle' ? circleId : null,
        music_track_id: selectedMusic ? selectedMusic.id : null,
        tagged_people: taggedPeople.length > 0 ? JSON.stringify(taggedPeople) : null,
      });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Güncellenirken hata oluştu.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-pin-modal-overlay">
      <div className="create-pin-modal-content mobile-full">
        <div className="modal-header">
          <h3>{step === 'STAGE_1' ? COPY.stage1Title : COPY.stage2Title}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body scrollable">
          {step === 'STAGE_1' && (
            <div className="stage-1-container">
              {prefilledPhotoPreviews.length > 0 ? (
                <div className="photo-strip">
                  {prefilledPhotoPreviews.map((preview, i) => (
                    <img key={i} src={preview} alt="Selected" className="strip-image" />
                  ))}
                </div>
              ) : (
                <div className="no-photo-placeholder">
                  <Edit3 size={40} color="var(--text-muted)" />
                  <p>Sadece Yazı</p>
                </div>
              )}

              <div className="location-preview">
                <div className="mini-map">
                  <MapContainer 
                    center={[defaultCoords.lat, defaultCoords.lng]} 
                    zoom={15} 
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    style={{ width: '100%', height: '100px', borderRadius: '12px' }}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Marker position={[defaultCoords.lat, defaultCoords.lng]} icon={modalMarkerIcon} />
                  </MapContainer>
                </div>
                <p className="address-label">{prefilledAddress || COPY.locationConfirmed}</p>
                <p className="date-label">{defaultDate}</p>
              </div>

              <div className="input-group">
                <textarea 
                  placeholder={COPY.addNotePlaceholder}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="privacy-selector-inline">
                <button 
                  className={`privacy-btn ${privacyMode === 'private' ? 'active' : ''}`}
                  onClick={() => setPrivacyMode('private')}
                >
                  <Lock size={14}/> {COPY.privacyPrivateTag}
                </button>
                <button 
                  className={`privacy-btn ${privacyMode === 'circle' ? 'active' : ''}`}
                  onClick={() => setPrivacyMode('circle')}
                  disabled={joinedCircles.length === 0}
                >
                  <User size={14}/> {COPY.privacyCircleTag}
                </button>
                <button 
                  className={`privacy-btn ${privacyMode === 'public' ? 'active' : ''}`}
                  onClick={() => setPrivacyMode('public')}
                >
                  <Globe size={14}/> {COPY.privacyPublicTag}
                </button>
              </div>

              <button 
                className="btn-primary w-100" 
                onClick={handleSaveMemory}
                disabled={loading}
              >
                {loading ? COPY.memorySavedLoading : COPY.save}
              </button>
            </div>
          )}

          {step === 'STAGE_2' && (
            <div className="stage-2-container">
              <div className="success-banner">
                🎉 Anınız kaydedildi! Şimdi detaylandırmak ister misiniz?
              </div>

              <div className="input-group">
                <label><Music size={16}/> Müzik Ekle</label>
                <div className="search-bar-wrapper">
                  <input 
                    type="text" 
                    placeholder="Şarkı ara..." 
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchSongs();
                    }}
                  />
                </div>
                {searching && <p>Aranıyor...</p>}
                {selectedMusic && (
                  <div className="selected-music">
                    🎵 {selectedMusic.title} - {selectedMusic.artist}
                    <X size={14} onClick={() => setSelectedMusic(null)} style={{cursor: 'pointer'}} />
                  </div>
                )}
                <div className="music-results">
                  {searchResults.map((track) => (
                    <div key={track.id} className="music-track-item" onClick={() => setSelectedMusic({id: track.id.toString(), title: track.title, artist: track.artist.name})}>
                      <img src={track.album.cover_small} alt="cover" />
                      <div>
                        <strong>{track.title}</strong>
                        <span>{track.artist.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label><User size={16}/> Kişiler</label>
                <input 
                  type="text" 
                  placeholder="Etiketle (örn: ahmet, ayşe)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setTaggedPeople([...taggedPeople, e.currentTarget.value]);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="tags-container">
                  {taggedPeople.map(p => (
                    <span key={p} className="tag">{p} <X size={12} onClick={() => setTaggedPeople(taggedPeople.filter(t => t !== p))} /></span>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label><Lock size={16}/> Gizlilik</label>
                <div className="privacy-options">
                  <button className={`privacy-btn ${privacyMode === 'private' ? 'active' : ''}`} onClick={() => setPrivacyMode('private')}>Sadece Ben</button>
                  <button className={`privacy-btn ${privacyMode === 'public' ? 'active' : ''}`} onClick={() => setPrivacyMode('public')}>Herkes</button>
                  {joinedCircles.length > 0 && (
                    <button className={`privacy-btn ${privacyMode === 'circle' ? 'active' : ''}`} onClick={() => setPrivacyMode('circle')}>Çember</button>
                  )}
                </div>
                {privacyMode === 'circle' && (
                  <select value={circleId || ''} onChange={(e) => setCircleId(e.target.value)} style={{ marginTop: '10px' }}>
                    {joinedCircles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <div className="input-group">
                <label><Edit3 size={16}/> {COPY.enrichEditNoteLabel}</label>
                <textarea 
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                />
              </div>

              <div className="stage-2-actions">
                <button className="btn-secondary" onClick={onClose}>{COPY.close}</button>
                <button className="btn-primary" onClick={handleUpdateEnrichments}>{COPY.save}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
