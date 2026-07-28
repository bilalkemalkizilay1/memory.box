import { useState, useRef } from 'react';
import { BottomNav } from './BottomNav';
import { MobileMapExperience as MapComponent } from '@/features/map/mobile/MobileMapExperience';
import { DiaryPanel } from '@/features/memories/mobile/DiaryPanel';
import { CirclesPanel } from '@/features/circles/mobile/CirclesPanel';
import { SenPanel } from '@/features/profile/mobile/SenPanel';
import { HakkindaPanel } from '@/features/profile/mobile/HakkindaPanel';

import { CreateMemoryFlow } from '@/features/memories/mobile/CreateMemoryFlow';
import { HeroPreview } from '@/features/memories/mobile/HeroPreview';
import { EditMemoryModal } from '@/features/memories/mobile/EditMemoryModal';
import { Search, User } from 'lucide-react';
import { Memory } from '@/shared/types/types';

// Custom Hooks
import { useProfile } from '@features/profile/shared/useProfile';
import { useCircles } from '@features/circles/shared/useCircles';
import { useMemories } from '@features/memories/shared/useMemories';
import { useMemoryCreation } from '@hooks/useMemoryCreation';

export type MobileRoute = 'map' | 'circles' | 'memories' | 'profile' | 'hakkinda';

export default function MobileApp() {
  const [navStack, setNavStack] = useState<MobileRoute[]>(['map']);
  const currentRoute = navStack[navStack.length - 1];

  const navigateTo = (route: MobileRoute) => {
    if (currentRoute !== route) {
      setNavStack(['map', route]); // Reset stack to map -> new route for bottom nav
    }
  };

  const goBack = () => {
    setNavStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<Memory | null>(null);
  
  const handleDirectAddClick = () => {
    document.getElementById('mobile-gallery')?.click();
  };

  const mapRef = useRef<any>(null);

  const { userProfile, setUserProfile } = useProfile();
  const { joinedCircles, setJoinedCircles, selectedCircleId, setSelectedCircleId } = useCircles();
  const {
    privatePins, myCreatedPinIds, likesAndHugs, searchQuery,
    setSearchQuery, tagged_peopleFilter, setPeopleFilter, allUniquePeople, visiblePins,
    handlePinSubmit, handlePinUpdate, handleLike, handleHug
  } = useMemories(joinedCircles, selectedCircleId);

  const handlePanToPin = (memory: Memory) => {
    setNavStack(['map']); // Go straight back to map
    if (mapRef.current) {
      mapRef.current.setView([memory.lat, memory.lng], 16);
    }
  };

  const {
    isPinningMode,
    showPinModal,
    prefilledData,
    handleMediaFileSelected,
    confirmPinLocation,
    cancelPinning,
    closePinModal,
    triggerPinSubmit,
    extractionStatus
  } = useMemoryCreation(handlePanToPin);

  const onMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleMediaFileSelected(files, mapRef);
    }
    e.target.value = ''; // Reset input to allow selecting the same file again
  };

  return (
    <div className="app-container mobile-app">
      {/* Mobile Top Search Bar (Only on Map Tab) */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: currentRoute === 'map' ? 'flex' : 'none',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '90%',
        maxWidth: '480px',
        pointerEvents: 'none'
      }}>
          <div className="search-bar-wrapper" style={{ position: 'relative', top: 0, left: 0, transform: 'none', width: '100%', pointerEvents: 'auto' }}>
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {allUniquePeople.length > 0 && (
            <div style={{ 
              display: 'flex', gap: '0.4rem', overflowX: 'auto', padding: '2px 4px',
              whiteSpace: 'nowrap', scrollbarWidth: 'none', maxWidth: '100%', pointerEvents: 'auto'
            }}>
              <span 
                onClick={() => setPeopleFilter(null)}
                style={{ 
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.65rem', 
                  background: !tagged_peopleFilter ? 'var(--text-active)' : '#FAF8F5',
                  color: !tagged_peopleFilter ? '#fff' : 'var(--text-muted)', 
                  borderRadius: '8px', cursor: 'pointer',
                  border: !tagged_peopleFilter ? '1px solid var(--text-active)' : '1px solid rgba(44, 44, 44, 0.12)'
                }}
              >Hepsi</span>
              {allUniquePeople.map(person => (
                <span 
                  key={person}
                  onClick={() => setPeopleFilter(tagged_peopleFilter === person ? null : person)}
                  style={{ 
                    fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.65rem', 
                    background: tagged_peopleFilter === person ? 'var(--text-active)' : '#FAF8F5',
                    color: tagged_peopleFilter === person ? '#fff' : 'var(--text-muted)', 
                    borderRadius: '8px', cursor: 'pointer',
                    border: tagged_peopleFilter === person ? '1px solid var(--text-active)' : '1px solid rgba(44, 44, 44, 0.12)',
                    display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
                  }}
                ><User size={11} style={{ marginRight: '3px' }} /> {person}</span>
              ))}
            </div>
          )}
        </div>

      {/* Map is always rendered, visually hides behind mobile-screen overlays */}
      <MapComponent 
        memories={visiblePins}
        isPinningMode={isPinningMode}
        onConfirmPinLocation={confirmPinLocation}
        onCancelPinning={cancelPinning}
        onLike={handleLike}
        onHug={handleHug}
        likesAndHugs={likesAndHugs}
        mapRef={mapRef}
        myCreatedPinIds={myCreatedPinIds}
        onEditPin={(memory) => {
          setEditingPin(memory);
          setIsEditModalOpen(true);
        }}
      />

      {/* Screens */}
      <CirclesPanel 
        isOpen={currentRoute === 'circles'} 
        onClose={goBack}
        joinedCircles={joinedCircles}
        setJoinedCircles={setJoinedCircles}
        selectedCircleId={selectedCircleId}
        setSelectedCircleId={setSelectedCircleId}
      />

      <DiaryPanel 
        isOpen={currentRoute === 'memories'} 
        onClose={goBack}
        privatePins={privatePins}
        onPinClick={(memory) => {
          setEditingPin(memory);
          setIsEditModalOpen(true);
        }}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />

      <SenPanel 
        isOpen={currentRoute === 'profile'} 
        onClose={goBack}
        publicAndCirclePins={[]}
        privatePins={privatePins}
        myCreatedPinIds={myCreatedPinIds}
        userProfile={userProfile}
        onEditPin={(memory: Memory) => {
          setEditingPin(memory);
          setIsEditModalOpen(true);
        }}
      />

      <HakkindaPanel 
        isOpen={currentRoute === 'hakkinda'} 
        onClose={goBack}
      />

      {/* Full Screen Modals */}
      <CreateMemoryFlow 
        isOpen={showPinModal}
        onClose={closePinModal}
        joinedCircles={joinedCircles}
        existingPeople={allUniquePeople}
        onSubmit={(data) => { triggerPinSubmit(data, handlePinSubmit); return Promise.resolve(editingPin as Memory); }}
        prefilledPhotos={prefilledData.photos}
        prefilledPhotoPreviews={prefilledData.photoPreviews}
        prefilledCoords={prefilledData.lat && prefilledData.lng ? { lat: prefilledData.lat, lng: prefilledData.lng } : null}
        prefilledDate={prefilledData.date}
        prefilledAddress={prefilledData.address}
      />

      {extractionStatus !== 'idle' && (
        <HeroPreview 
          status={extractionStatus} 
          photoUrl={prefilledData.photoPreviews[0] || null} 
        />
      )}

      <EditMemoryModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPin(null);
        }}
        memory={editingPin}
        joinedCircles={joinedCircles}
        existingPeople={allUniquePeople}
        onSubmit={handlePinUpdate}
      />

      <BottomNav 
        activeTab={currentRoute as any} 
        setActiveTab={navigateTo} 
        onAddClick={handleDirectAddClick}
      />

      <input type="file" id="mobile-gallery" accept="image/*" multiple className="hidden-file-input" onChange={onMediaFileChange} />
    </div>
  );
}
