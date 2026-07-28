import { useState } from 'react';
import { EXIFService } from '@services/EXIFService';
import { MemoryCreationData } from '@services/MemoryCreationService';
import { Memory } from '@shared/types/types';
import toast from 'react-hot-toast';
import { COPY } from '@shared/constants/microcopy';

export type ExtractionStatus = 'idle' | 'reading_photo' | 'finding_location' | 'success' | 'error';

interface PrefilledData {
  photos: File[];
  photoPreviews: string[];
  lat: number | null;
  lng: number | null;
  date: string | null;
  address: string | null;
}

export function useMemoryCreation(onPinCreated: (memory: Memory) => void) {
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('idle');
  const sessionRef = React.useRef(0);

  const [prefilledData, setPrefilledData] = useState<PrefilledData>({
    photos: [],
    photoPreviews: [],
    lat: null,
    lng: null,
    date: null,
    address: null
  });

  const handleMediaFileSelected = async (files: File[], mapRef: React.MutableRefObject<any>) => {
    setShowMediaSelector(false);
    
    sessionRef.current += 1;
    const currentSession = sessionRef.current;

    setExtractionStatus('reading_photo');
    const previews = files.map(f => URL.createObjectURL(f));
    setPrefilledData(prev => ({ ...prev, photos: files, photoPreviews: previews }));

    // Extract EXIF from the first photo
    const firstPhoto = files[0];
    const metadata = await EXIFService.extractMetadata(firstPhoto);
    if (currentSession !== sessionRef.current) return;

    let address = null;
    if (metadata.lat && metadata.lng) {
      setExtractionStatus('finding_location');
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${metadata.lat}&lon=${metadata.lng}`);
        const data = await res.json();
        address = data.display_name;
      } catch (err) {
        console.warn("Geocoding failed", err);
      }
    }
    if (currentSession !== sessionRef.current) return;

    setPrefilledData(prev => ({
      ...prev,
      lat: metadata.lat || null,
      lng: metadata.lng || null,
      date: metadata.date ? metadata.date.substring(0, 10) : null,
      address
    }));

    if (metadata.lat && metadata.lng) {
      setExtractionStatus('success');
      setTimeout(() => {
        if (currentSession !== sessionRef.current) return;
        setPinCoords({ lat: metadata.lat!, lng: metadata.lng! });
        setShowPinModal(true);
        setExtractionStatus('idle');
        if (mapRef.current) {
          mapRef.current.setView([metadata.lat, metadata.lng], 16);
        }
      }, 1500); // Give time for Hero Preview checkmarks to show
    } else {
      setExtractionStatus('error');
      setTimeout(() => {
        if (currentSession !== sessionRef.current) return;
        setIsPinningMode(true);
        setExtractionStatus('idle');
        toast(COPY.locationMissing, { icon: '📍' });
      }, 1500);
    }
  };

  const confirmPinLocation = (lat: number, lng: number) => {
    setPinCoords({ lat, lng });
    setIsPinningMode(false);
    setShowPinModal(true);
  };

  const cancelPinning = () => {
    sessionRef.current += 1;
    setIsPinningMode(false);
    setExtractionStatus('idle');
    prefilledData.photoPreviews.forEach(url => URL.revokeObjectURL(url));
    setPrefilledData({ photos: [], photoPreviews: [], lat: null, lng: null, date: null, address: null });
  };

  const startManualPinning = () => {
    setIsPinningMode(true);
  };

  const closePinModal = () => {
    sessionRef.current += 1;
    setShowPinModal(false);
    prefilledData.photoPreviews.forEach(url => URL.revokeObjectURL(url));
    setPrefilledData({ photos: [], photoPreviews: [], lat: null, lng: null, date: null, address: null });
  };

  const triggerPinSubmit = async (data: any, handlePinSubmitCore: (d: MemoryCreationData) => Promise<Memory>) => {
    const memory = await handlePinSubmitCore({
      lat: pinCoords.lat,
      lng: pinCoords.lng,
      ...data
    });
    
    closePinModal();
    onPinCreated(memory);
  };

  return {
    isPinningMode,
    showPinModal,
    showMediaSelector,
    setShowMediaSelector,
    pinCoords,
    prefilledData,
    handleMediaFileSelected,
    confirmPinLocation,
    cancelPinning,
    startManualPinning,
    closePinModal,
    triggerPinSubmit,
    extractionStatus
  };
}
