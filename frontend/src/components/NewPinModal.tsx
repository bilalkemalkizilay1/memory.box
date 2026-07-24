import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Upload, Music } from 'lucide-react';
import { Circle, Pin } from '../types';
import * as api from '../services/api';

interface NewPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinedCircles: Circle[];
  existingPeople: string[];
  onSubmit: (data: {
    content: string;
    privacy_mode: 'public' | 'circle' | 'private';
    circle_id: string | null;
    memory_date: string;
    image: File | null;
    spotify_track_id: string | null;
    people: string | null;
  }) => Promise<Pin>;
  
  // Prefilled vision v2
  prefilledPhoto?: File | null;
  prefilledPhotoPreview?: string | null;
  prefilledCoords?: { lat: number; lng: number } | null;
  prefilledDate?: string | null;
  prefilledAddress?: string | null;
}

// Leaflet map centerer helper
const MapCenterer: React.FC<{ coords: { lat: number; lng: number } }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([coords.lat, coords.lng], 15);
  }, [coords, map]);
  return null;
};

// Custom circle stamp marker icon
const modalMarkerIcon = L.divIcon({
  className: 'custom-pin-marker-modal',
  html: `<div class="pin-stamp" style="background-color: var(--color-private); width: 24px; height: 24px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export const NewPinModal: React.FC<NewPinModalProps> = ({
  isOpen,
  onClose,
  joinedCircles,
  onSubmit,
  prefilledPhoto,
  prefilledPhotoPreview,
  prefilledCoords,
  prefilledDate,
  prefilledAddress
}) => {
  const [content, setContent] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'public' | 'circle' | 'private'>('private');
  const [circleId, setCircleId] = useState<string | null>(joinedCircles[0]?.id || null);
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().substring(0, 10));
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Coordinates state for mini-map
  const [modalCoords, setModalCoords] = useState<{ lat: number; lng: number }>({ lat: 41.028, lng: 29.000 });
  const [addressLabel, setAddressLabel] = useState<string>('Konum belirleniyor...');
  
  // Post-save state
  const [savedPinId, setSavedPinId] = useState<string | null>(null);
  const [songQuery, setSongQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefilledPhotoPreview) {
        setImagePreview(prefilledPhotoPreview);
      } else {
        setImagePreview(null);
      }
      if (prefilledPhoto) {
        setImage(prefilledPhoto);
      } else {
        setImage(null);
      }
      if (prefilledDate) {
        setMemoryDate(prefilledDate);
      } else {
        setMemoryDate(new Date().toISOString().substring(0, 10));
      }
      if (prefilledCoords) {
        setModalCoords(prefilledCoords);
      } else {
        setModalCoords({ lat: 41.028, lng: 29.000 });
      }
      if (prefilledAddress) {
        setAddressLabel(prefilledAddress);
      } else {
        setAddressLabel('Konum seçin');
      }

      // Reset fields
      setContent('');
      setPrivacyMode('private');
      setSavedPinId(null);
      setSongQuery('');
      setSearchResults([]);
      setError(null);
    }
  }, [isOpen, prefilledPhotoPreview, prefilledPhoto, prefilledDate, prefilledCoords, prefilledAddress]);

  // Handle marker drag coordinate extraction and geocode update
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setModalCoords({ lat: newPos.lat, lng: newPos.lng });
          setAddressLabel('Konum çözümleniyor...');
          
          fetch(`/api/pins/reverse-geocode?lat=${newPos.lat}&lng=${newPos.lng}`)
            .then(res => res.json())
            .then(data => {
              setAddressLabel(data.label || 'Konum onaylandı');
            })
            .catch(err => {
              console.warn(err);
              setAddressLabel(`${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`);
            });
        }
      },
    }),
    [],
  );

  const handleSearchSongs = async () => {
    if (!songQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(songQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError('Şarkı aranırken bir hata oluştu.');
    } finally {
      setSearching(false);
    }
  };

  const handleSaveSong = async (track: any) => {
    if (!savedPinId) return;
    setLoading(true);
    setError(null);
    try {
      await api.updatePin(savedPinId, {
        content,
        privacy_mode: privacyMode,
        circle_id: privacyMode === 'circle' ? circleId : null,
        memory_date: memoryDate,
        spotify_track_id: track.id
      });
      onClose();
      setSavedPinId(null);
    } catch (err) {
      setError('Şarkı eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const savedPin = await onSubmit({
        content,
        privacy_mode: privacyMode,
        circle_id: privacyMode === 'circle' ? circleId : null,
        memory_date: memoryDate,
        image: image,
        spotify_track_id: null,
        people: null
      });

      // Transition to song picker step
      setSavedPinId(savedPin.id);
    } catch (err) {
      setError('Anı kaydedilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Render music selector step if memory is saved
  if (savedPinId) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-active)', marginBottom: '0.75rem' }}>
            <Music size={40} />
          </div>
          <h2 className="panel-title" style={{ marginBottom: '0.5rem' }}>Müzik Ekle</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Harika! Anınız kaydedildi. Bu anıya eşlik edecek bir şarkı eklemek ister misiniz?
          </p>

          {error && <div style={{ color: 'var(--color-public)', fontSize: '0.8rem', marginBottom: '1rem' }}>⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text"
              className="form-input"
              placeholder="Şarkı veya sanatçı ara..."
              value={songQuery}
              onChange={(e) => setSongQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSongs();
                }
              }}
            />
            <button 
              type="button"
              className="btn-primary"
              onClick={handleSearchSongs}
              disabled={searching || !songQuery.trim()}
              style={{ padding: '0 1rem', height: '42px', borderRadius: '10px' }}
            >
              {searching ? '...' : 'Ara'}
            </button>
          </div>

          {searching && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
              🎵 Şarkılar aranıyor (İlk aramada sunucu uyanıyorsa 30-40 saniye sürebilir)...
            </div>
          )}

          {searchResults.length > 0 && (
            <div style={{ 
              maxHeight: '180px', 
              overflowY: 'auto', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              marginBottom: '1.5rem'
            }}>
              {searchResults.map((track) => (
                <div 
                  key={track.id}
                  onClick={() => handleSaveSong(track)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem', 
                    borderBottom: '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <img 
                    src={track.cover} 
                    alt="Cover" 
                    style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} 
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {track.artist}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="form-buttons" style={{ justifyContent: 'center' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                onClose();
                setSavedPinId(null);
              }}
              disabled={loading}
              style={{ width: '100%' }}
            >
              Atla (Şarkı Ekleme)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render primary confirmation form step
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button 
          className="panel-close-btn" 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}
        >
          <X size={20} />
        </button>

        <h2 className="panel-title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Anıyı Onayla</h2>

        {error && <div style={{ color: 'var(--color-public)', fontSize: '0.8rem', marginBottom: '1rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Prefilled image preview / selection dropzone */}
          <div className="form-group">
            <div 
              className="file-upload-container"
              style={{ position: 'relative', height: imagePreview ? '180px' : 'auto', padding: imagePreview ? '0' : '1.5rem' }}
            >
              <input 
                type="file"
                ref={fileInputRef}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 10
                }}
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="file-upload-preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
              ) : (
                <>
                  <Upload className="file-upload-icon" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tıklayıp Fotoğraf Seçin</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Zaman ve konum bilgileri otomatik okunur</span>
                </>
              )}
            </div>
          </div>

          {/* Address label */}
          <div style={{ 
            fontSize: '0.82rem', 
            fontWeight: 600, 
            color: 'var(--text-active)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem',
            background: 'rgba(90, 103, 216, 0.05)',
            padding: '0.65rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(90, 103, 216, 0.1)'
          }}>
            📍 {addressLabel}
          </div>

          {/* Embedded draggable Leaflet mini map */}
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Konumu Düzenle (Haritada marker'ı sürükleyin)</label>
            <div style={{ height: '180px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <MapContainer 
                center={[modalCoords.lat, modalCoords.lng]} 
                zoom={15} 
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <Marker 
                  ref={markerRef}
                  draggable={true}
                  eventHandlers={eventHandlers}
                  position={[modalCoords.lat, modalCoords.lng]}
                  icon={modalMarkerIcon}
                />
                <MapCenterer coords={modalCoords} />
              </MapContainer>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Düşünceleriniz (Notunuz)</label>
            <textarea 
              className="form-textarea"
              placeholder="Burada ne yaşandı? Anılarınızı yazın..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Advanced/Optional settings: Privacy options (hidden or toggleable) */}
          <div className="form-group">
            <label className="form-label">Gizlilik Modu</label>
            <div className="form-select-group">
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'private' ? 'active-private' : ''}`}
                onClick={() => setPrivacyMode('private')}
              >
                🔒 Sadece Ben
              </button>
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'circle' ? 'active-circle' : ''}`}
                onClick={() => setPrivacyMode('circle')}
              >
                👥 Çember
              </button>
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'public' ? 'active-public' : ''}`}
                onClick={() => setPrivacyMode('public')}
              >
                🌍 Açık (Public)
              </button>
            </div>
          </div>

          {privacyMode === 'circle' && (
            <div className="form-group">
              <label className="form-label">Çember Seçimi</label>
              <select 
                className="form-input"
                value={circleId || ''}
                onChange={(e) => setCircleId(e.target.value)}
                required
              >
                {joinedCircles.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-buttons">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>İptal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Pini Onayla ve Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
