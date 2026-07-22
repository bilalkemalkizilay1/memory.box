import { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapComponent } from './components/MapComponent';
import { DiaryPanel } from './components/DiaryPanel';
import { CirclesPanel } from './components/CirclesPanel';
import { SenPanel } from './components/SenPanel';
import { HakkindaPanel } from './components/HakkindaPanel';
import { NewPinModal } from './components/NewPinModal';
import { EditPinModal } from './components/EditPinModal';
import { Search, User } from 'lucide-react';
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

  // Write changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('mb_profile', JSON.stringify(userProfile));
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
      mapRef.current.setView([41.0836, 29.0511], 15);
    }
  };

  const handleConfirmPinLocation = (lat: number, lng: number) => {
    setPinCoords({ lat, lng });
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
  }) => {
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
    } else {
      // Server upload
      const formData = new FormData();
      formData.append('lat', pinCoords.lat.toString());
      formData.append('lng', pinCoords.lng.toString());
      formData.append('content', data.content);
      formData.append('privacy_mode', data.privacy_mode);
      formData.append('memory_date', data.memory_date);
      if (data.circle_id) formData.append('circle_id', data.circle_id);
      if (data.spotify_track_id) formData.append('spotify_track_id', data.spotify_track_id);
      if (data.people) formData.append('people', data.people);
      if (data.image) formData.append('image', data.image);

      const savedPin = await api.createPin(formData);
      setServerPins(prev => [savedPin, ...prev]);
      setMyCreatedPinIds(prev => [...prev, savedPin.id]);
    }
  };

  // Handle pin update/edit
  const handlePinUpdate = async (id: string, updatedData: {
    content: string;
    privacy_mode: 'public' | 'circle' | 'private';
    circle_id: string | null;
    memory_date: string;
    spotify_track_id: string | null;
    people: string | null;
  }) => {
    const isPrivateBefore = privatePins.some(p => p.id === id);
    
    if (updatedData.privacy_mode === 'private') {
      if (isPrivateBefore) {
        // 1. Private -> Private: Update locally
        const updated = privatePins.map(p => {
          if (p.id === id) {
            return {
              ...p,
              content: updatedData.content,
              memory_date: updatedData.memory_date,
              spotify_track_id: updatedData.spotify_track_id,
              people: updatedData.people || null
            };
          }
          return p;
        });
        setPrivatePins(updated);
        localStorage.setItem('mb_private_pins', JSON.stringify(updated));
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
          const formData = new FormData();
          formData.append('lat', privatePin.lat.toString());
          formData.append('lng', privatePin.lng.toString());
          formData.append('content', updatedData.content);
          formData.append('privacy_mode', updatedData.privacy_mode);
          formData.append('memory_date', updatedData.memory_date);
          if (updatedData.circle_id) formData.append('circle_id', updatedData.circle_id);
          if (updatedData.spotify_track_id) formData.append('spotify_track_id', updatedData.spotify_track_id);
          if (updatedData.people) formData.append('people', updatedData.people);
          
          const savedPin = await api.createPin(formData);
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

  // Interactions (Like)
  const handleLike = async (id: string) => {
    const interaction = likesAndHugs[id] || { liked: false, hugged: false };
    if (interaction.liked) return; // already liked

    // local-only pin check
    if (id.startsWith('local-')) {
      setPrivatePins(prev => prev.map(p => p.id === id ? { ...p, likes_count: p.likes_count + 1 } : p));
      setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, liked: true } }));
      return;
    }

    try {
      const res = await api.likePin(id);
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, likes_count: res.likes_count } : p));
      setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, liked: true } }));
    } catch (err) {
      console.error(err);
    }
  };

  // Interactions (Hug)
  const handleHug = async (id: string) => {
    const interaction = likesAndHugs[id] || { liked: false, hugged: false };
    if (interaction.hugged) return; // already hugged

    if (id.startsWith('local-')) {
      setPrivatePins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: p.hugs_count + 1 } : p));
      setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, hugged: true } }));
      return;
    }

    try {
      const res = await api.hugPin(id);
      setServerPins(prev => prev.map(p => p.id === id ? { ...p, hugs_count: res.hugs_count } : p));
      setLikesAndHugs(prev => ({ ...prev, [id]: { ...interaction, hugged: true } }));
    } catch (err) {
      console.error(err);
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
    </div>
  );
}
