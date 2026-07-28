import { useState, useRef } from 'react';

import { Sidebar } from './Sidebar';
import { DesktopMapExperience as MapComponent } from '@/features/map/desktop/DesktopMapExperience';
import { DiaryPanel } from '@/features/memories/desktop/DiaryPanel';
import { CirclesPanel } from '@/features/circles/desktop/CirclesPanel';
import { SenPanel } from '@/features/profile/desktop/SenPanel';
import { HakkindaPanel } from '@/features/profile/desktop/HakkindaPanel';
import { CreateMemoryFlow } from '../../features/memories/desktop/CreateMemoryFlow';
import { EditMemoryModal } from '../../features/memories/desktop/EditMemoryModal';
import { Search, User, Plus, Camera, X, Edit3 } from 'lucide-react';
import { Memory } from '@/shared/types/types';

// Custom Hooks
import { useProfile } from '@features/profile/shared/useProfile';
import { useCircles } from '@features/circles/shared/useCircles';
import { useMemories } from '@features/memories/shared/useMemories';
import { useMemoryCreation } from '@hooks/useMemoryCreation';

export default function DesktopApp() {
  const [activePanel, setActivePanel] = useState<'cemberler' | 'gunluk' | 'sen' | 'hakkinda' | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<Memory | null>(null);

  const mapRef = useRef<any>(null);

  const { userProfile, setUserProfile } = useProfile();
  const { joinedCircles, setJoinedCircles, selectedCircleId, setSelectedCircleId } = useCircles();
  const {
    privatePins, serverPins, myCreatedPinIds, likesAndHugs, searchQuery,
    setSearchQuery, tagged_peopleFilter, setPeopleFilter, allUniquePeople, visiblePins,
    handlePinSubmit, handlePinUpdate, handleLike, handleHug
  } = useMemories(joinedCircles, selectedCircleId);

  const handlePanToPin = (memory: Memory) => {
    if (mapRef.current) {
      mapRef.current.setView([memory.lat, memory.lng], 16);
      setActivePanel(null);
    }
  };

  const {
    isPinningMode,
    showPinModal,
    showMediaSelector,
    setShowMediaSelector,
    prefilledData,
    handleMediaFileSelected,
    confirmPinLocation,
    cancelPinning,
    startManualPinning,
    closePinModal,
    triggerPinSubmit
  } = useMemoryCreation(handlePanToPin);

  const handleGeneralMapClick = () => {
    setSelectedCircleId(null);
    if (mapRef.current) {
      mapRef.current.setView([41.028, 29.000], 12.5);
    }
  };

  const onMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleMediaFileSelected(files, mapRef);
    }
  };

  return (
    <div className="app-container desktop-app">
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
                background: !tagged_peopleFilter ? 'var(--text-active)' : '#FAF8F5',
                color: !tagged_peopleFilter ? '#fff' : 'var(--text-muted)', 
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(44,44,44,0.05)',
                border: !tagged_peopleFilter ? '1px solid var(--text-active)' : '1px solid rgba(44, 44, 44, 0.12)',
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
                onClick={() => setPeopleFilter(tagged_peopleFilter === person ? null : person)}
                style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  padding: '0.25rem 0.65rem', 
                  background: tagged_peopleFilter === person ? 'var(--text-active)' : '#FAF8F5',
                  color: tagged_peopleFilter === person ? '#fff' : 'var(--text-muted)', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(44,44,44,0.05)',
                  border: tagged_peopleFilter === person ? '1px solid var(--text-active)' : '1px solid rgba(44, 44, 44, 0.12)',
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

      <div className="desktop-only-sidebar">
        <Sidebar 
          activePanel={activePanel} 
          setActivePanel={setActivePanel}
          isPinningMode={isPinningMode}
          onStartPinning={startManualPinning}
          onCancelPinning={cancelPinning}
          onGeneralMapClick={handleGeneralMapClick}
        />
      </div>

      <div className="map-container-wrapper">
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
      </div>

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
        onEditPin={(memory) => {
          setEditingPin(memory);
          setIsEditModalOpen(true);
        }}
      />

      <HakkindaPanel 
        isOpen={activePanel === 'hakkinda'}
        onClose={() => setActivePanel(null)}
      />

      <CreateMemoryFlow
        isOpen={showPinModal}
        onClose={closePinModal}
        joinedCircles={joinedCircles}
        existingPeople={allUniquePeople}
        onSubmit={(data) => { triggerPinSubmit(data, handlePinSubmit); return Promise.resolve(editingPin as Memory); }}
        prefilledPhotos={prefilledData.photos}
        prefilledPhotoPreviews={prefilledData.photoPreviews}
      />

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

      <div className="desktop-only-fab">
        {!showMediaSelector ? (
          <button 
            className="fab-main" 
            onClick={() => setShowMediaSelector(true)}
            title="Yeni Anı Ekle (Fotoğraf veya Yazı)"
          >
            <Plus size={28} />
          </button>
        ) : (
          <div className="fab-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
            <button 
              className="fab-option-btn" 
              onClick={() => setShowMediaSelector(false)}
              style={{ background: '#fff', color: 'var(--text-muted)' }}
              title="İptal"
            >
              <X size={20} />
            </button>
            
            <label className="fab-option-btn" title="Fotoğraflı Anı (Konumu otomatik bulur)">
              <Camera size={20} /> Fotoğraf
              <input type="file" id="media-upload-desktop" accept="image/*" style={{ display: 'none' }} onChange={onMediaFileChange} />
            </label>

            <button 
              className="fab-option-btn" 
              onClick={startManualPinning}
              title="Haritadan Konum Seç"
            >
              <Plus size={20} /> Haritada Seç
            </button>

            <button 
              className="fab-option-btn"
              onClick={() => {
                startManualPinning();
              }}
              title="Sadece Yazı"
            >
              <Edit3 size={20} /> Sadece Yazı
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
