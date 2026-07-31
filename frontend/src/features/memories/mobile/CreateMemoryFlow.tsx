import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { X, Camera, ChevronRight, ChevronLeft, MapPin } from 'lucide-react';
import { Memory } from '@/shared/types/types';
import toast from 'react-hot-toast';

interface CreateMemoryFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    memory_date: string;
    images: File[];
    privacy_mode: 'private';
    circle_id: null;
    music_track_id: null;
    tagged_people: null;
  }) => Promise<Memory>;
  prefilledPhotos: File[];
  prefilledPhotoPreviews: string[];
  prefilledCoords: { lat: number; lng: number } | null;
  prefilledDate: string | null;
  prefilledAddress: string | null;
}

type Step = 'PHOTO' | 'PREVIEW' | 'STORY' | 'LOCATION';

const modalMarkerIcon = L.divIcon({
  className: 'custom-pin-marker-modal',
  html: `<div class="pin-stamp" style="background-color: var(--mobile-accent); width: 24px; height: 24px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); border-radius: 50%;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export const CreateMemoryFlow: React.FC<CreateMemoryFlowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefilledPhotos,
  prefilledPhotoPreviews,
  prefilledCoords,
  prefilledDate,
  prefilledAddress,
}) => {
  const [step, setStep] = useState<Step>('PHOTO');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultCoords = prefilledCoords || { lat: 41.028, lng: 29.000 };
  const defaultDate = prefilledDate || new Date().toISOString().substring(0, 10);
  const address = prefilledAddress || 'Moda Sahili, İstanbul'; // Mock for MVP

  useEffect(() => {
    if (isOpen) {
      if (prefilledPhotos.length > 0) {
        setPhotos(prefilledPhotos);
        setPhotoPreviews(prefilledPhotoPreviews);
        setStep('PREVIEW');
      } else {
        setPhotos([]);
        setPhotoPreviews([]);
        setStep('PHOTO');
      }
      setContent('');
    }
  }, [isOpen, prefilledPhotos, prefilledPhotoPreviews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotos([file]);
      setPhotoPreviews([URL.createObjectURL(file)]);
      setStep('PREVIEW');
    }
  };

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const memoryPromise = onSubmit({
        content: content.trim() || '...',
        memory_date: defaultDate,
        images: photos,
        privacy_mode: 'private',
        circle_id: null,
        music_track_id: null,
        tagged_people: null
      });

      toast.promise(memoryPromise, {
        loading: 'Haritaya bırakılıyor...',
        success: 'Bu an artık haritanda.',
        error: 'Bir hata oluştu.'
      });

      await memoryPromise;
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-page open" style={{ zIndex: 1000, background: 'var(--mobile-bg)' }}>
      {/* Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--mobile-safe-top) var(--mobile-spacing-lg) 16px', background: 'transparent' }}>
        <button 
          onClick={() => {
            if (step === 'PHOTO') onClose();
            else if (step === 'PREVIEW' && prefilledPhotos.length === 0) setStep('PHOTO');
            else if (step === 'PREVIEW') onClose();
            else if (step === 'STORY') setStep('PREVIEW');
            else if (step === 'LOCATION') setStep('STORY');
          }}
          style={{ background: 'none', border: 'none', padding: '8px', color: 'var(--mobile-text-main)' }}
        >
          {step === 'PHOTO' ? <X size={24} /> : <ChevronLeft size={28} />}
        </button>
        <span style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '18px', fontWeight: 600 }}>
          {step === 'PHOTO' ? 'Fotoğraf Seç' : 
           step === 'PREVIEW' ? 'Önizleme' : 
           step === 'STORY' ? 'Hikayen' : 'Konum'}
        </span>
        <div style={{ width: '40px' }} /> {/* Spacer */}
      </div>

      <div className="mobile-page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 80px)', padding: '0 var(--mobile-spacing-lg) var(--mobile-spacing-lg)' }}>
        
        {/* STEP: PHOTO */}
        {step === 'PHOTO' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--mobile-surface)', borderRadius: '24px', width: '100%', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #E5E0D8' }}>
              <Camera size={48} color="var(--mobile-accent)" style={{ marginBottom: '16px', opacity: 0.8 }} />
              <p style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '20px', color: 'var(--mobile-text-main)', marginBottom: '8px' }}>Bugünden bir kare seç</p>
              <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '14px', color: 'var(--mobile-text-secondary)', marginBottom: '24px' }}>Fotoğrafların, geçmişinin en güzel hikayeleri.</p>
              
              <label className="mobile-button mobile-button-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                Galeriyi Aç
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              </label>
            </div>
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === 'PREVIEW' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, borderRadius: '24px', overflow: 'hidden', background: '#e0e0e0', marginBottom: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              {photoPreviews[0] && (
                <img src={photoPreviews[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <button className="mobile-button mobile-button-primary" onClick={() => setStep('STORY')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Devam <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP: STORY */}
        {step === 'STORY' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             {photoPreviews[0] && (
               <div style={{ width: '100%', height: '120px', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                  <img src={photoPreviews[0]} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               </div>
             )}
            <p style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '24px', fontWeight: 600, color: 'var(--mobile-text-main)', marginBottom: '16px' }}>Bu an sana ne hissettirdi?</p>
            <textarea 
              autoFocus
              placeholder="Sadece tek bir güzel cümle yeterli..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--mobile-font)', fontSize: '18px', color: 'var(--mobile-text-main)', resize: 'none', lineHeight: 1.5 }}
            />
            <button 
              className="mobile-button mobile-button-primary" 
              onClick={() => setStep('LOCATION')} 
              style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Devam <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* STEP: LOCATION & SAVE */}
        {step === 'LOCATION' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <p style={{ fontFamily: 'var(--mobile-font-serif)', fontSize: '24px', fontWeight: 600, color: 'var(--mobile-text-main)', marginBottom: '8px' }}>Bu anın yaşandığı yer</p>
             <p style={{ fontFamily: 'var(--mobile-font)', fontSize: '15px', color: 'var(--mobile-text-secondary)', marginBottom: '24px' }}>Konum otomatik olarak algılandı.</p>
             
             <div style={{ width: '100%', height: '200px', borderRadius: '24px', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--mobile-border)' }}>
               <MapContainer 
                  center={[defaultCoords.lat, defaultCoords.lng]} 
                  zoom={15} 
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={[defaultCoords.lat, defaultCoords.lng]} icon={modalMarkerIcon} />
                </MapContainer>
             </div>
             
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--mobile-surface)', borderRadius: '16px', border: '1px solid var(--mobile-border)' }}>
               <MapPin size={18} color="var(--mobile-accent)" />
               <span style={{ fontFamily: 'var(--mobile-font)', fontSize: '15px', fontWeight: 500, color: 'var(--mobile-text-main)' }}>{address}</span>
             </div>

            <button 
              className="mobile-button mobile-button-primary" 
              onClick={handleSave} 
              disabled={loading}
              style={{ width: '100%', marginTop: 'auto' }}
            >
              {loading ? 'Bırakılıyor...' : 'Haritaya Bırak'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
