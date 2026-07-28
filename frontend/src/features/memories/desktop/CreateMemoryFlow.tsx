import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Music, MapPin, ArrowLeft, Compass } from 'lucide-react';
import { Circle, Memory } from '@/shared/types/types';
import * as api from '@/shared/api/api';
import exifr from 'exifr';

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
}

// Leaflet map centerer helper
const MapCenterer: React.FC<{ coords: { lat: number; lng: number } }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([coords.lat, coords.lng], 15);
  }, [coords, map]);
  return null;
};

const modalMarkerIcon = L.divIcon({
  className: 'custom-pin-marker-modal',
  html: `<div class="pin-stamp" style="background-color: var(--color-private); width: 24px; height: 24px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

type Step = 'SELECT_MEDIA' | 'VALIDATE_LOCATION' | 'WRITE_STORY' | 'ADD_MUSIC';

export const CreateMemoryFlow: React.FC<CreateMemoryFlowProps> = ({
  isOpen,
  onClose,
  joinedCircles,
  onSubmit,
  prefilledPhotos,
  prefilledPhotoPreviews,
}) => {
  const [step, setStep] = useState<Step>('SELECT_MEDIA');
  
  // Media State
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // EXIF / Location State
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 41.028, lng: 29.000 });
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().substring(0, 10));
  const [addressLabel, setAddressLabel] = useState<string>('Konum belirleniyor...');
  
  // Story State
  const [content, setContent] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'public' | 'circle' | 'private'>('private');
  const [circleId, setCircleId] = useState<string | null>(joinedCircles[0]?.id || null);
  
  // Post-save state
  const [savedMemoryId, setSavedMemoryId] = useState<string | null>(null);
  const [songQuery, setSongQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset fields when opened
  useEffect(() => {
    if (isOpen) {
      setStep('SELECT_MEDIA');
      setImages(prefilledPhotos || []);
      setImagePreviews(prefilledPhotoPreviews || []);
      setPrivacyMode('private');
      setSavedMemoryId(null);
      setSongQuery('');
      setSearchResults([]);
      setError(null);
      // set to current location by default
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setCoords({ lat: 41.028, lng: 29.000 })
        );
      }
    }
  }, [isOpen]);

  const extractExifAndProceed = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0]; // Extract EXIF from first photo
    let foundLat: number | null = null;
    let foundLng: number | null = null;
    let foundDate: string | null = null;

    try {
      const gps = await exifr.gps(file);
      if (gps && gps.latitude && gps.longitude) {
        foundLat = gps.latitude;
        foundLng = gps.longitude;
      }
      const exif = await exifr.parse(file, ['DateTimeOriginal']);
      if (exif && exif.DateTimeOriginal) {
        const d = new Date(exif.DateTimeOriginal);
        foundDate = d.toISOString().substring(0, 10);
      }
    } catch (err) {
      console.warn("EXIF extraction failed", err);
    }

    if (foundLat && foundLng) {
      setCoords({ lat: foundLat, lng: foundLng });
      fetch(`/api/memories/reverse-geocode?lat=${foundLat}&lng=${foundLng}`)
        .then(res => res.json())
        .then(data => setAddressLabel(data.label))
        .catch(() => setAddressLabel(`${foundLat!.toFixed(4)}, ${foundLng!.toFixed(4)}`));
    } else {
      setAddressLabel("Konum bulunamadı, manuel ortalayın");
    }

    if (foundDate) setMemoryDate(foundDate);
    
    setStep('VALIDATE_LOCATION');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setImages(files);
    
    const previews: string[] = [];
    files.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setImagePreviews([...previews]);
          extractExifAndProceed(files);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const newPos = marker.getLatLng();
      setCoords({ lat: newPos.lat, lng: newPos.lng });
      setAddressLabel('Konum çözümleniyor...');
      
      fetch(`/api/memories/reverse-geocode?lat=${newPos.lat}&lng=${newPos.lng}`)
        .then(res => res.json())
        .then(data => setAddressLabel(data.label || 'Konum onaylandı'))
        .catch(() => setAddressLabel(`${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`));
    }
  };

  const handleSearchSongs = async () => {
    if (!songQuery.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(songQuery)}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSearchResults(data);
    } catch {
      setError('Müzik bulunamadı.');
    } finally {
      setSearching(false);
    }
  };

  const handleSaveMemory = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const saved = await onSubmit({
        content,
        privacy_mode: privacyMode,
        circle_id: privacyMode === 'circle' ? circleId : null,
        memory_date: memoryDate,
        images: images,
        music_track_id: null,
        tagged_people: null
      });
      setSavedMemoryId(saved.id);
      setStep('ADD_MUSIC');
    } catch {
      setError('Anı kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMusic = async (track: any) => {
    if (!savedMemoryId) return;
    setLoading(true);
    try {
      await api.updateMemory(savedMemoryId, {
        content,
        privacy_mode: privacyMode,
        circle_id: privacyMode === 'circle' ? circleId : null,
        memory_date: memoryDate,
        music_track_id: track.id,
      });
      onClose();
    } catch {
      setError('Müzik eklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flow-container" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh',
      backgroundColor: '#fff', zIndex: 10000, display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eaeaea' }}>
        {step !== 'SELECT_MEDIA' && step !== 'ADD_MUSIC' ? (
          <button onClick={() => setStep(step === 'VALIDATE_LOCATION' ? 'SELECT_MEDIA' : 'VALIDATE_LOCATION')} style={{ background: 'none', border: 'none', padding: 0 }}>
            <ArrowLeft size={24} />
          </button>
        ) : <div style={{ width: 24 }} />}
        
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
          {step === 'SELECT_MEDIA' ? 'Fotoğraf Seç' : 
           step === 'VALIDATE_LOCATION' ? 'Konumu Doğrula' : 
           step === 'WRITE_STORY' ? 'Anını Yaz' : 'Müzik Ekle'}
        </h2>
        
        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 0 }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        {step === 'SELECT_MEDIA' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
            <Compass size={48} color="var(--text-active)" />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, textAlign: 'center' }}>Yeni Bir Anı Yarat</h3>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem', maxWidth: '80%' }}>
              Galerinizden fotoğraf seçin. Nerede ve ne zaman çekildiğini otomatik bulacağız.
            </p>
            <input 
              type="file" 
              accept="image/*" 
              multiple
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
            <button 
              className="btn-primary" 
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '0.8rem 2rem', fontSize: '1rem', marginTop: '1rem' }}
            >
              Fotoğraf Yükle
            </button>
            <button 
              onClick={() => { setImages([]); setStep('VALIDATE_LOCATION'); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-active)', marginTop: '0.5rem', fontWeight: 600 }}
            >
              Sadece Yazı (Fotoğrafsız)
            </button>
          </div>
        )}

        {step === 'VALIDATE_LOCATION' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
            <div style={{ padding: '0.8rem', backgroundColor: '#f7fafc', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <MapPin size={18} color="var(--text-active)" />
              {addressLabel}
            </div>
            
            <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '300px' }}>
              <MapContainer center={[coords.lat, coords.lng]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <Marker 
                  ref={markerRef}
                  draggable={true}
                  eventHandlers={{ dragend: handleDragEnd }}
                  position={[coords.lat, coords.lng]}
                  icon={modalMarkerIcon}
                />
                <MapCenterer coords={coords} />
              </MapContainer>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Gerekirse kırmızı ikonu sürükleyerek konumu düzeltebilirsiniz.
            </p>
            <button className="btn-primary" onClick={() => setStep('WRITE_STORY')} style={{ padding: '1rem' }}>
              Konumu Doğrula
            </button>
          </div>
        )}

        {step === 'WRITE_STORY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', height: '100%' }}>
            {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {imagePreviews.map((preview, i) => (
                  <img key={i} src={preview} alt="Preview" style={{ height: '100px', width: '100px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
                ))}
              </div>
            )}
            
            <textarea 
              className="form-textarea"
              placeholder="Bu anının hikayesini anlat..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ flex: 1, minHeight: '150px' }}
            />

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Kimler Görebilir?</label>
              <div className="form-select-group">
                <button className={`privacy-toggle-btn ${privacyMode === 'private' ? 'active-private' : ''}`} onClick={() => setPrivacyMode('private')}>Sadece Ben</button>
                <button className={`privacy-toggle-btn ${privacyMode === 'circle' ? 'active-circle' : ''}`} onClick={() => setPrivacyMode('circle')}>Çember</button>
                <button className={`privacy-toggle-btn ${privacyMode === 'public' ? 'active-public' : ''}`} onClick={() => setPrivacyMode('public')}>Açık</button>
              </div>
            </div>

            {privacyMode === 'circle' && (
              <select className="form-input" value={circleId || ''} onChange={(e) => setCircleId(e.target.value)}>
                {joinedCircles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            <button className="btn-primary" onClick={handleSaveMemory} disabled={loading || !content.trim()} style={{ padding: '1rem', marginTop: '1rem' }}>
              {loading ? 'Kaydediliyor...' : 'Anıyı Kaydet'}
            </button>
          </div>
        )}

        {step === 'ADD_MUSIC' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: '1rem' }}>
            <Music size={48} color="var(--text-active)" style={{ marginTop: '2rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, textAlign: 'center' }}>Harika! Şarkı Ekleyelim</h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <input 
                type="text" className="form-input" placeholder="Şarkı veya sanatçı..."
                value={songQuery} onChange={(e) => setSongQuery(e.target.value)}
              />
              <button className="btn-primary" onClick={handleSearchSongs} disabled={searching} style={{ padding: '0 1.5rem' }}>
                Ara
              </button>
            </div>

            <div style={{ flex: 1, width: '100%', overflowY: 'auto' }}>
              {searchResults.map(track => (
                <div key={track.id} onClick={() => handleAddMusic(track)} style={{ display: 'flex', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid #eaeaea', cursor: 'pointer' }}>
                  <img src={track.cover} alt="Cover" style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{track.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{track.artist}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-secondary" onClick={onClose} style={{ padding: '1rem', width: '100%' }}>
              Müzik Eklemeden Bitir
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
