import { useState, useEffect, useRef, useMemo } from 'react';
import exifr from 'exifr';
import { Sidebar } from './components/Sidebar';
import { MapComponent } from './components/MapComponent';
import { DiaryPanel } from './components/DiaryPanel';
import { CirclesPanel } from './components/CirclesPanel';
import { SenPanel } from './components/SenPanel';
import { HakkindaPanel } from './components/HakkindaPanel';
import { NewPinModal } from './components/NewPinModal';
import { EditPinModal } from './components/EditPinModal';
import { Search, User, Plus, Camera, X, Edit3 } from 'lucide-react';
import { Pin, Circle } from './types';
import * as api from './services/api';

const DEFAULT_CIRCLES: Circle[] = [
  { id: 'bogazici-cimler', name: 'Boğaziçi Çimleri 🍀', created_at: new Date().toISOString() },
  { id: 'bebek-sahili', name: 'Bebek Sahil Yolu 🌊', created_at: new Date().toISOString() },
  { id: 'hisarustu-kahve', name: 'Hisarüstü Kahve Sohbetleri ☕', created_at: new Date().toISOString() }
];

export default function App() {
  const [activePanel, setActivePanel] = useState<'cemberler' | 'gunluk' | 'sen' | 'hakkinda' | null>(null);
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // Sync state with localStorage
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(() => {
    const val = localStorage.getItem('mb_profile');
    return val ? JSON.parse(val) : null;
  });

  const [joinedCircles, setJoinedCircles] = useState<Circle[]>(() => {
    const val = localStorage.getItem('mb_circles');
    return val ? JSON.parse(val) : DEFAULT_CIRCLES;
  });

  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  const [privatePins, setPrivatePins] = useState<Pin[]>(() => {
    const val = localStorage.getItem('mb_private_pins');
    return val ? JSON.parse(val) : [];
  });

  const [likesAndHugs, setLikesAndHugs] = useState<Record<string, { liked: boolean; hugged: boolean }>>(() => {
    const val = localStorage.getItem('mb_likes_hugs');
    return val ? JSON.parse(val) : {};
  });

  const [myCreatedPinIds, setMyCreatedPinIds] = useState<string[]>(() => {
    const val = localStorage.getItem('mb_my_created_pin_ids');
    return val ? JSON.parse(val) : [];
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);

  // Prefilled states for Photo-First Vision (v2)
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [prefilledPhoto, setPrefilledPhoto] = useState<File | null>(null);
  const [prefilledPhotoPreview, setPrefilledPhotoPreview] = useState<string | null>(null);
  const [prefilledCoords, setPrefilledCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [prefilledAddress, setPrefilledAddress] = useState<string | null>(null);

  // Server pins (public and circle pins)
  const [serverPins, setServerPins] = useState<Pin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [peopleFilter, setPeopleFilter] = useState<string | null>(null);
  
  const mapRef = useRef<any>(null);

  const allUniquePeople = useMemo(() => {
    const peopleSet = new Set<string>();
    [...serverPins, ...privatePins].forEach(p => {
      if (p.people) {
        try {
          const parsed: string[] = JSON.parse(p.people);
          parsed.forEach(person => peopleSet.add(person));
        } catch (err) {
          console.error("Error parsing people:", err);
        }
      }
    });
    return Array.from(peopleSet);
  }, [serverPins, privatePins]);

  // Write changes to LocalStorage and sync profile with server
  useEffect(() => {
    localStorage.setItem('mb_profile', JSON.stringify(userProfile));
    if (userProfile) {
      api.syncProfile(userProfile.name, userProfile.email)
        .catch(err => console.error("Failed to sync profile with server:", err));
    }
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('mb_circles', JSON.stringify(joinedCircles));
  }, [joinedCircles]);

  useEffect(() => {
    localStorage.setItem('mb_private_pins', JSON.stringify(privatePins));
  }, [privatePins]);

  useEffect(() => {
    localStorage.setItem('mb_likes_hugs', JSON.stringify(likesAndHugs));
  }, [likesAndHugs]);

  useEffect(() => {
    localStorage.setItem('mb_my_created_pin_ids', JSON.stringify(myCreatedPinIds));
  }, [myCreatedPinIds]);

  // Load server-side pins (public + circle pins the user joined)
  const loadServerPins = async () => {
    try {
      const circleIds = joinedCircles.map(c => c.id);
      const pins = await api.fetchPins(circleIds);
      setServerPins(pins);

      // Auto-populate myCreatedPinIds if empty for seamless local testing
      const savedCreatedIds = localStorage.getItem('mb_my_created_pin_ids');
      const parsedIds = savedCreatedIds ? JSON.parse(savedCreatedIds) : [];
      if (parsedIds.length === 0 && pins.length > 0) {
        const allIds = pins.map(p => p.id);
        setMyCreatedPinIds(allIds);
        localStorage.setItem('mb_my_created_pin_ids', JSON.stringify(allIds));
      }
    } catch (err) {
      console.error('Error fetching server pins:', err);
    }
  };

  useEffect(() => {
    loadServerPins();
  }, [joinedCircles]);

  // Warm up backend cold start on mount
  useEffect(() => {
    fetch('/api/profile/sync', {
      headers: {
        'X-Author-Token': localStorage.getItem('mb_author_token') || 'warmup-token'
      }
    }).then(() => {
      console.log('Backend server warmed up successfully.');
    }).catch(err => {
      console.warn('Backend warm up failed:', err);
    });
  }, []);

  // Sync queued offline pins when internet is restored
  useEffect(() => {
    const handleOnlineSync = async () => {
      const queue = localStorage.getItem('mb_pending_sync_queue');
      if (!queue) return;
      const pendingPins = JSON.parse(queue);
      if (pendingPins.length === 0) return;

      console.log(`Syncing ${pendingPins.length} offline pins...`);
      const remaining: any[] = [];

      for (const pin of pendingPins) {
        try {
          await api.createPin({
            lat: pin.lat,
            lng: pin.lng,
            content: pin.content,
            privacy_mode: pin.privacy_mode,
            circle_id: pin.circle_id,
            memory_date: pin.memory_date,
            spotify_track_id: pin.spotify_track_id,
            people: pin.people,
            image: null
          });
        } catch (err) {
          console.error("Failed to sync offline pin, keeping in queue:", err);
          remaining.push(pin);
        }
      }

      localStorage.setItem('mb_pending_sync_queue', JSON.stringify(remaining));
      
      // Reload server pins to replace temporary local IDs with actual database IDs
      loadServerPins();
      
      if (remaining.length === 0) {
        alert("✅ Çevrimdışı kaydedilen tüm anılarınız başarıyla sunucuya yüklendi!");
      }
    };

    window.addEventListener('online', handleOnlineSync);
    // Also trigger on mount if online
    if (navigator.onLine) {
      handleOnlineSync();
    }
    return () => window.removeEventListener('online', handleOnlineSync);
  }, [joinedCircles]);

  // Pan map to specific pin
  const handlePanToPin = (pin: Pin) => {
    if (mapRef.current) {
      mapRef.current.setView([pin.lat, pin.lng], 16);
      setActivePanel(null); // Close sidebar panels to focus on the map pin popup
    }
  };

  // Reset filters and pan back to campus center
  const handleGeneralMapClick = () => {
    setSelectedCircleId(null);
    if (mapRef.current) {
      mapRef.current.setView([41.028, 29.000], 12.5);
    }
  };

  const handleMediaFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowMediaSelector(false);
    setPrefilledPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrefilledPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    let lat: number | null = null;
    let lng: number | null = null;
    let dateStr: string | null = null;

    try {
      // 1. Read EXIF GPS data using exifr
      const gps = await exifr.gps(file);
      if (gps && gps.latitude && gps.longitude) {
        lat = gps.latitude;
        lng = gps.longitude;
      }

      // 2. Read EXIF DateTimeOriginal
      const exif = await exifr.parse(file, ['DateTimeOriginal']);
      if (exif && exif.DateTimeOriginal) {
        const d = new Date(exif.DateTimeOriginal);
        dateStr = d.toISOString().substring(0, 10);
      }
    } catch (err) {
      console.warn("Failed to extract EXIF metadata:", err);
    }

    if (lat && lng) {
      setPrefilledCoords({ lat, lng });
      setPinCoords({ lat, lng }); // keep map pin position sync
      try {
        const res = await fetch(`/api/pins/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          setPrefilledAddress(data.label);
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
        setPrefilledAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } else {
      setPrefilledCoords(null);
      // Fallback: use map center or current GPS position
      const center = mapRef.current ? mapRef.current.getCenter() : { lat: 41.028, lng: 29.000 };
      setPinCoords({ lat: center.lat, lng: center.lng });
      setPrefilledAddress("Konum bulunamadı, manuel seçin");
    }

    if (dateStr) {
      setPrefilledDate(dateStr);
    } else {
      setPrefilledDate(new Date().toISOString().substring(0, 10));
    }

    setShowPinModal(true);
  };

  const openTextOnlyCreation = () => {
    setPrefilledPhoto(null);
    setPrefilledPhotoPreview(null);
    setPrefilledCoords(null);
    const center = mapRef.current ? mapRef.current.getCenter() : { lat: 41.028, lng: 29.000 };
    setPinCoords({ lat: center.lat, lng: center.lng });
    setPrefilledAddress("Konum seçin");
    setPrefilledDate(new Date().toISOString().substring(0, 10));
    setShowPinModal(true);
  };
  const handleConfirmPinLocation = (lat: number, lng: number) => {
    setPrefilledPhoto(null);
    setPrefilledPhotoPreview(null);
    setPrefilledCoords(null);
    setPinCoords({ lat, lng });
    setPrefilledAddress("Konum onaylandı");
    setPrefilledDate(new Date().toISOString().substring(0, 10));
    setIsPinningMode(false);
    setShowPinModal(true);
  };

  // Handle memory submission
  const handlePinSubmit = async (data: {
    content: string;
    privacy_mode: 'public' | 'circle' | 'private';
    circle_id: string | null;
    memory_date: string;
    image: File | null;
    spotify_track_id: string | null;
    people: string | null;
  }): Promise<Pin> => {
    const queueOfflinePin = (): Pin => {
      const offlinePin: Pin = {
        id: `offline-${Date.now()}`,
        lat: pinCoords.lat,
        lng: pinCoords.lng,
        content: data.content,
        privacy_mode: data.privacy_mode,
        circle_id: data.circle_id,
        created_at: new Date().toISOString(),
        memory_date: data.memory_date,
        likes_count: 0,
        hugs_count: 0,
        spotify_track_id: null,
        people: data.people || null,
        image_url: null
      };
      
      setServerPins(prev => [offlinePin, ...prev]);
      setMyCreatedPinIds(prev => [...prev, offlinePin.id]);
      
      const currentQueue = localStorage.getItem('mb_pending_sync_queue');
      const queueList = currentQueue ? JSON.parse(currentQueue) : [];
      queueList.push({
        lat: pinCoords.lat,
        lng: pinCoords.lng,
        content: data.content,
        privacy_mode: data.privacy_mode,
        circle_id: data.circle_id,
        memory_date: data.memory_date,
        spotify_track_id: null,
        people: data.people
      });
      localStorage.setItem('mb_pending_sync_queue', JSON.stringify(queueList));
      
      alert("🔌 İnternet bağlantısı yok. Anınız yerel olarak kaydedildi ve bağlandığınızda yüklenecektir.");
      return offlinePin;
    };

    if (data.privacy_mode === 'private') {
      // Local storage only
      const newPrivatePin: Pin = {
        id: `local-${Date.now()}`,
        lat: pinCoords.lat,
        lng: pinCoords.lng,
        content: data.content,
        privacy_mode: 'private',
        circle_id: null,
        created_at: new Date().toISOString(),
        memory_date: data.memory_date,
        likes_count: 0,
        hugs_count: 0,
        spotify_track_id: data.spotify_track_id,
        people: data.people || null,
        image_url: data.image ? URL.createObjectURL(data.image) : null // base64 / blob locally
      };
      // Convert to base64 if there is an image to survive page refresh
      if (data.image) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPrivatePin.image_url = reader.result as string;
          setPrivatePins(prev => [newPrivatePin, ...prev]);
        };
        reader.readAsDataURL(data.image);
      } else {
        setPrivatePins(prev => [newPrivatePin, ...prev]);
      }
      return newPrivatePin;
    } else {
      if (!navigator.onLine) {
        return queueOfflinePin();
      }

      try {
        // Server upload with decoupled media flow
        const savedPin = await api.createPin({
          lat: pinCoords.lat,
          lng: pinCoords.lng,
          content: data.content,
          privacy_mode: data.privacy_mode,
          circle_id: data.circle_id,
          memory_date: data.memory_date,
          spotify_track_id: data.spotify_track_id,
          people: data.people,
          image: data.image
        });
        setServerPins(prev => [savedPin, ...prev]);
        setMyCreatedPinIds(prev => [...prev, savedPin.id]);
        return savedPin;
      } catch (err) {
        console.warn("API pin submission failed, queuing offline:", err);
        return queueOfflinePin();
      }
    }
  };

  // Helper helper to convert local base64 data to File object for uploading
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Handle pin update/edit
  const handlePinUpdate = async (id: string, updatedData: {
    content: string;
    privacy_mode: 'public' | 'circle' | 'private';
    circle_id: string | null;
    memory_date: string;
    spotify_track_id: string | null;
    people: string | null;
    image: File | null;
  }) => {
    const isPrivateBefore = privatePins.some(p => p.id === id);
    
    if (updatedData.privacy_mode === 'private') {
      if (isPrivateBefore) {
        // 1. Private -> Private: Update locally
        const updateLocalPin = (base64Image?: string) => {
          const updated = privatePins.map(p => {
            if (p.id === id) {
              return {
                ...p,
                content: updatedData.content,
                memory_date: updatedData.memory_date,
                spotify_track_id: updatedData.spotify_track_id,
                people: updatedData.people || null,
                ...(base64Image !== undefined && { image_url: base64Image })
              };
            }
            return p;
          });
          setPrivatePins(updated);
          localStorage.setItem('mb_private_pins', JSON.stringify(updated));
        };

        if (updatedData.image) {
          const reader = new FileReader();
          reader.onloadend = () => {
            updateLocalPin(reader.result as string);
          };
          reader.readAsDataURL(updatedData.image);
        } else {
          updateLocalPin();
        }
      } else {
        // 2. Server -> Private: Move from server list to local list
        const updatedPin = await api.updatePin(id, updatedData);
        
        // Remove from server pins list
        setServerPins(prev => prev.filter(p => p.id !== id));
        
        // Add to private pins list
        const newPrivatePin: Pin = {
          ...updatedPin,
          privacy_mode: 'private',
          circle_id: null
        };
        const updatedLocal = [newPrivatePin, ...privatePins];
        setPrivatePins(updatedLocal);
        localStorage.setItem('mb_private_pins', JSON.stringify(updatedLocal));
      }
    } else {
      if (isPrivateBefore) {
        // 3. Private -> Server: Upload to server, remove from local
        const privatePin = privatePins.find(p => p.id === id);
        if (privatePin) {
          let finalImage: File | null = updatedData.image;
          // If no new image selected but the private pin had an image, convert its base64 to File
          if (!finalImage && privatePin.image_url && privatePin.image_url.startsWith('data:')) {
            try {
              finalImage = dataURLtoFile(privatePin.image_url, 'published-photo.jpg');
            } catch (e) {
              console.error("Error converting base64 image during publish:", e);
            }
          }

          const savedPin = await api.createPin({
            lat: privatePin.lat,
            lng: privatePin.lng,
            content: updatedData.content,
            privacy_mode: updatedData.privacy_mode,
            circle_id: updatedData.circle_id,
            memory_date: updatedData.memory_date,
            spotify_track_id: updatedData.spotify_track_id,
            people: updatedData.people,
            image: finalImage
          });
          setServerPins(prev => [savedPin, ...prev]);
          
          // Remove from local private pins
          const updatedLocal = privatePins.filter(p => p.id !== id);
          setPrivatePins(updatedLocal);
          localStorage.setItem('mb_private_pins', JSON.stringify(updatedLocal));

          // Save to my created IDs
          setMyCreatedPinIds(prev => [...prev, savedPin.id]);
        }
      } else {
        // 4. Server -> Server: Normal update
        const updatedPin = await api.updatePin(id, updatedData);
        setServerPins(prev => prev.map(p => p.id === id ? updatedPin : p));
      }
    }
  };

  const handleLike = async (id: string) => {
    const interaction = likesAndHugs[id] || { liked: false, hugged: false };
    if (interaction.liked) return;

    // 1. Optimistic Update
    setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, liked: true } }));
    if (id.startsWith('local-')) {
      setPrivatePins(prev => prev.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
      return;
    }

    setServerPins(prev => prev.map(p => p.id === id ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));

    // 2. Background API Call
    try {
      const res = await api.likePin(id);
      // Sync exact server count
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, likes_count: res.likes_count } : p));
    } catch (err) {
      console.warn("Optimistic Like failed, rolling back:", err);
      // 3. Rollback
      setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, liked: false } }));
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
    }
  };

  const handleHug = async (id: string) => {
    const interaction = likesAndHugs[id] || { liked: false, hugged: false };
    if (interaction.hugged) return;

    // 1. Optimistic Update
    setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, hugged: true } }));
    if (id.startsWith('local-')) {
      setPrivatePins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: (p.hugs_count || 0) + 1 } : p));
      return;
    }

    setServerPins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: (p.hugs_count || 0) + 1 } : p));

    // 2. Background API Call
    try {
      const res = await api.hugPin(id);
      // Sync exact server count
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: res.hugs_count } : p));
    } catch (err) {
      console.warn("Optimistic Hug failed, rolling back:", err);
      // 3. Rollback
      setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, hugged: false } }));
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: Math.max(0, (p.hugs_count || 0) - 1) } : p));
    }
  };

  // Compute all visible pins filtered by:
  // 1. Search Query
  // 2. Selected Circle ID (filter)
  // 3. Time Machine Year Slider
  const visiblePins = useMemo(() => {
    let all = [...serverPins, ...privatePins];

    // Filter by joined/selected circle
    if (selectedCircleId) {
      all = all.filter(p => p.privacy_mode === 'circle' && p.circle_id === selectedCircleId);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      all = all.filter(p => p.content.toLowerCase().includes(q));
    }

    // Filter by People
    if (peopleFilter) {
      all = all.filter(p => {
        if (!p.people) return false;
        try {
          const parsed: string[] = JSON.parse(p.people);
          return parsed.includes(peopleFilter);
        } catch {
          return false;
        }
      });
    }

    return all;
  }, [serverPins, privatePins, selectedCircleId, searchQuery, peopleFilter]);

  return (
    <div className="app-container">
      {/* Search & Filters Container */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '90%',
        maxWidth: '480px',
        pointerEvents: 'none'
      }}>
        {/* Search Input Card */}
        <div className="search-bar-wrapper" style={{ position: 'relative', top: 0, left: 0, transform: 'none', width: '100%', pointerEvents: 'auto' }}>
          <Search className="search-icon" />
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Hatırladığın bir yer, not veya kelime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tag Filters Row */}
        {allUniquePeople.length > 0 && (
          <div style={{ 
            display: 'flex', 
            gap: '0.4rem', 
            overflowX: 'auto', 
            padding: '2px 4px',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            maxWidth: '100%',
            pointerEvents: 'auto'
          }}>
            <span 
              onClick={() => setPeopleFilter(null)}
              style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                padding: '0.25rem 0.65rem', 
                background: !peopleFilter ? 'var(--text-active)' : '#FAF8F5',
                color: !peopleFilter ? '#fff' : 'var(--text-muted)', 
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(44,44,44,0.05)',
                border: !peopleFilter ? '1px solid var(--text-active)' : '1px solid rgba(44, 44, 44, 0.12)',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Hepsi
            </span>
            {allUniquePeople.map(person => (
              <span 
                key={person}
                onClick={() => setPeopleFilter(peopleFilter === person ? null : person)}
                style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  padding: '0.25rem 0.65rem', 
                  background: peopleFilter === person ? 'var(--text-active)' : '#FAF8F5',
                  color: peopleFilter === person ? '#fff' : 'var(--text-muted)', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(44,44,44,0.05)',
                  border: peopleFilter === person ? '1px solid var(--text-active)' : '1px solid rgba(44, 44, 44, 0.12)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <User size={11} style={{ marginRight: '3px' }} /> {person}
              </span>
            ))}
          </div>
        )}
      </div>



      <Sidebar 
        activePanel={activePanel} 
        setActivePanel={setActivePanel}
        isPinningMode={isPinningMode}
        setIsPinningMode={setIsPinningMode}
        onGeneralMapClick={handleGeneralMapClick}
      />

      <div className="map-container-wrapper">
        <MapComponent 
          pins={visiblePins}
          isPinningMode={isPinningMode}
          onConfirmPinLocation={handleConfirmPinLocation}
          onCancelPinning={() => setIsPinningMode(false)}
          onLike={handleLike}
          onHug={handleHug}
          likesAndHugs={likesAndHugs}
          mapRef={mapRef}
          myCreatedPinIds={myCreatedPinIds}
          onEditPin={(pin) => {
            setEditingPin(pin);
            setIsEditModalOpen(true);
          }}
        />
      </div>

      {/* Sliding panels */}
      <CirclesPanel 
        isOpen={activePanel === 'cemberler'}
        onClose={() => setActivePanel(null)}
        joinedCircles={joinedCircles}
        setJoinedCircles={setJoinedCircles}
        selectedCircleId={selectedCircleId}
        setSelectedCircleId={setSelectedCircleId}
      />

      <DiaryPanel 
        isOpen={activePanel === 'gunluk'}
        onClose={() => setActivePanel(null)}
        privatePins={privatePins}
        onPinClick={handlePanToPin}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />

      <SenPanel 
        isOpen={activePanel === 'sen'}
        onClose={() => setActivePanel(null)}
        publicAndCirclePins={serverPins}
        privatePins={privatePins}
        myCreatedPinIds={myCreatedPinIds}
        userProfile={userProfile}
        onEditPin={(pin) => {
          setEditingPin(pin);
          setIsEditModalOpen(true);
        }}
      />

      <HakkindaPanel 
        isOpen={activePanel === 'hakkinda'}
        onClose={() => setActivePanel(null)}
      />

      {/* Pin Submission modal */}
      <NewPinModal 
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setIsPinningMode(false);
        }}
        joinedCircles={joinedCircles}
        existingPeople={allUniquePeople}
        onSubmit={handlePinSubmit}
        prefilledPhoto={prefilledPhoto}
        prefilledPhotoPreview={prefilledPhotoPreview}
        prefilledCoords={prefilledCoords}
        prefilledDate={prefilledDate}
        prefilledAddress={prefilledAddress}
      />

      {/* Edit Pin Modal */}
      <EditPinModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPin(null);
        }}
        pin={editingPin}
        joinedCircles={joinedCircles}
        existingPeople={allUniquePeople}
        onSubmit={handlePinUpdate}
      />

      {/* Floating Action Button (FAB) for Photo-First Flow */}
      <button 
        type="button" 
        className="fab-btn" 
        onClick={() => setShowMediaSelector(true)}
        title="Anı Ekle"
      >
        <Plus size={24} />
      </button>

      {/* Media Selector Overlay */}
      {showMediaSelector && (
        <div className="media-selector-overlay" onClick={() => setShowMediaSelector(false)}>
          <div className="media-selector-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-title)', color: 'var(--text-dark)' }}>Anı Ekle</h3>
              <button 
                onClick={() => setShowMediaSelector(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Input file for photos */}
            <div style={{ position: 'relative' }}>
              <input 
                type="file"
                accept="image/*"
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
                onChange={handleMediaFileSelected}
              />
              <button type="button" className="media-selector-option">
                <span className="media-selector-option-icon">
                  <Camera size={20} />
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Fotoğraf Çek / Galeriden Seç</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>EXIF konum ve zaman bilgisi otomatik okunur</div>
                </div>
              </button>
            </div>

            <button 
              type="button" 
              className="media-selector-option"
              onClick={() => {
                setShowMediaSelector(false);
                openTextOnlyCreation();
              }}
            >
              <span className="media-selector-option-icon">
                <Edit3 size={20} />
              </span>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Sadece Yazı Yaz</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>Konumu harita üzerinden manuel seçin</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
