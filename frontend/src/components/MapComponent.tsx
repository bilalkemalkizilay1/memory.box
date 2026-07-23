import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Pin } from '../types';
import { Heart, X, Crosshair, Lock, Users, Globe, Calendar, User, Smile, Play, Pause } from 'lucide-react';
import { fetchSongDetails } from '../services/api';

interface MapComponentProps {
  pins: Pin[];
  isPinningMode: boolean;
  onConfirmPinLocation: (lat: number, lng: number) => void;
  onCancelPinning: () => void;
  onLike: (id: string) => Promise<void>;
  onHug: (id: string) => Promise<void>;
  likesAndHugs: Record<string, { liked: boolean; hugged: boolean }>;
  mapRef: React.MutableRefObject<any>;
}

interface TrackPlayerProps {
  trackId: string;
  isOpen: boolean;
}

const TrackPlayer: React.FC<TrackPlayerProps> = ({ trackId, isOpen }) => {
  const [track, setTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState<HTMLAudioElement | null>(() => {
    return typeof Audio !== 'undefined' ? new Audio() : null;
  });

  // Fetch track details
  useEffect(() => {
    let active = true;
    fetchSongDetails(trackId)
      .then(data => {
        if (active) setTrack(data);
      })
      .catch(err => console.error('Error fetching song details', err));

    return () => {
      active = false;
      if (audio) {
        audio.pause();
      }
    };
  }, [trackId, audio]);

  // Handle play/pause based on isOpen state
  useEffect(() => {
    if (!audio || !track) return;
    
    if (isOpen) {
      audio.src = track.preview;
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn("Autoplay was prevented by browser policy", err);
          setIsPlaying(false);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [isOpen, track, audio]);

  // Audio ended listener
  useEffect(() => {
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => console.error("Audio play error", err));
      setIsPlaying(true);
    }
  };

  if (!track) {
    return (
      <div style={{ 
        marginTop: '0.65rem',
        padding: '0.5rem',
        background: 'rgba(245, 239, 230, 0.4)',
        border: '1px dashed rgba(44, 44, 44, 0.15)',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-ui)'
      }}>
        Müzik yükleniyor...
      </div>
    );
  }

  return (
    <div className="compact-player-wrapper" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.65rem', 
      padding: '0.5rem', 
      position: 'relative',
      zIndex: 10
    }}>
      <img 
        src={track.cover} 
        alt="Cover" 
        style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} 
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.artist}
        </div>
      </div>
      
      {track.preview && (
        <button 
          onClick={togglePlay}
          style={{
            background: 'var(--text-active)',
            color: '#fff',
            border: 'none',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            padding: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isPlaying ? <Pause size={10} fill="#fff" /> : <Play size={10} fill="#fff" style={{ marginLeft: '1px' }} />}
        </button>
      )}
    </div>
  );
};

// Custom DivIcons for each privacy type (matches design targets)
const createCustomIcon = (mode: 'private' | 'circle' | 'public') => {
  let color = 'var(--color-private)';
  if (mode === 'circle') color = 'var(--color-circle)';
  if (mode === 'public') color = 'var(--color-public)';

  return L.divIcon({
    className: 'custom-pin',
    html: `<div class="pin-stamp" style="background-color: ${color};"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
};

// Custom Cluster icon matching reference screenshot #1
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="custom-cluster"><span>${count}</span></div>`,
    className: 'custom-cluster-container',
    iconSize: L.point(32, 32, true)
  });
};



// Helper component to bind map ref and handle positioning
const MapController: React.FC<{ mapRef: React.MutableRefObject<any> }> = ({ mapRef }) => {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
};

// Helper component to track center coordinates during manual pinning
const CenterTracker: React.FC<{ 
  isPinningMode: boolean; 
  setCenterCoords: (c: { lat: number; lng: number }) => void 
}> = ({ isPinningMode, setCenterCoords }) => {
  const map = useMap();

  useMapEvents({
    move: () => {
      if (isPinningMode) {
        const center = map.getCenter();
        setCenterCoords({ lat: center.lat, lng: center.lng });
      }
    }
  });

  useEffect(() => {
    if (isPinningMode) {
      const center = map.getCenter();
      setCenterCoords({ lat: center.lat, lng: center.lng });
    }
  }, [isPinningMode, map, setCenterCoords]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  pins,
  isPinningMode,
  onConfirmPinLocation,
  onCancelPinning,
  onLike,
  onHug,
  likesAndHugs,
  mapRef
}) => {
  const initialPosition: [number, number] = [41.028, 29.000]; // Central Istanbul / Bosphorus
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({ lat: 41.028, lng: 29.000 });
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [openPinId, setOpenPinId] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedMobilePin, setSelectedMobilePin] = useState<Pin | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSelectedMobilePin(null);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to trigger floating heart micro-animation
  const triggerReactionAnimation = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    const id = Date.now() + Math.random();
    
    setHearts(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 800);
  };

  return (
    <div className="map-container-wrapper">
      <MapContainer
        center={initialPosition}
        zoom={12.5}
        zoomControl={true}
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />



        <MapController mapRef={mapRef} />
        
        <CenterTracker isPinningMode={isPinningMode} setCenterCoords={setCenterCoords} />

        {/* Marker Clustering */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          showCoverageOnHover={false}
          maxClusterRadius={40}
        >
          {pins.map(pin => {
            const hasLiked = likesAndHugs[pin.id]?.liked || false;
            const hasHugged = likesAndHugs[pin.id]?.hugged || false;

            return (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={createCustomIcon(pin.privacy_mode)}
                eventHandlers={{
                  click: () => {
                    if (isMobile) {
                      setSelectedMobilePin(pin);
                      setOpenPinId(pin.id);
                    } else {
                      setOpenPinId(pin.id);
                    }
                  }
                }}
              >
                {!isMobile && (
                  <Popup 
                    autoPan={true} 
                    autoPanPaddingTopLeft={[0, 200]}
                    eventHandlers={{
                      add: () => setOpenPinId(pin.id),
                      remove: () => {
                        setOpenPinId(prev => prev === pin.id ? null : prev);
                      }
                    }}
                  >
                  <div className="memory-popup-card">
                    <div className="memory-popup-body">
                      <div className="memory-popup-text-column">
                        <div className="memory-popup-text">{pin.content}</div>
                        <div className="memory-popup-meta">
                          <span className="memory-popup-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            {pin.privacy_mode === 'private' && <><Lock size={12} /> Günlük</>}
                            {pin.privacy_mode === 'circle' && <><Users size={12} /> Çember</>}
                            {pin.privacy_mode === 'public' && <><Globe size={12} /> Açık</>}
                          </span>
                          <span className="memory-popup-date" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                            <Calendar size={12} /> {new Date(pin.memory_date).toLocaleDateString('tr-TR')}
                          </span>
                        </div>

                        {pin.people && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.45rem' }}>
                            {JSON.parse(pin.people).map((person: string) => (
                              <span 
                                key={person} 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  fontWeight: 600, 
                                  background: 'rgba(90, 103, 216, 0.08)', 
                                  color: 'var(--text-active)', 
                                  padding: '0.15rem 0.45rem', 
                                  borderRadius: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.15rem'
                                }}
                              >
                                <User size={10} /> {person}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {pin.image_url && (
                        <div className="memory-popup-image-column">
                          <img 
                            src={pin.image_url.startsWith('/uploads') ? pin.image_url : pin.image_url} 
                            alt="Pin" 
                            className="memory-popup-image" 
                          />
                        </div>
                      )}
                    </div>

                    {pin.spotify_track_id && (
                      <TrackPlayer trackId={pin.spotify_track_id} isOpen={openPinId === pin.id} />
                    )}

                    <div className="memory-popup-actions">
                      <button 
                        className={`memory-action-btn ${hasLiked ? 'active-like' : ''}`}
                        onClick={(e) => {
                          triggerReactionAnimation(e);
                          onLike(pin.id);
                        }}
                      >
                        <Heart size={14} fill={hasLiked ? 'var(--color-public)' : 'none'} />
                        <span>Beğen ({pin.likes_count || 0})</span>
                      </button>

                      <button 
                        className={`memory-action-btn ${hasHugged ? 'active-hug' : ''}`}
                        onClick={(e) => {
                          triggerReactionAnimation(e);
                          onHug(pin.id);
                        }}
                      >
                        <Smile size={14} />
                        <span>Sarıl ({pin.hugs_count || 0})</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Manual Pinning Target Crosshair */}
      {isPinningMode && (
        <>
          <div className="map-crosshair-overlay">
            <Crosshair className="crosshair-icon" size={32} />
            <div className="crosshair-tooltip" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', pointerEvents: 'auto' }}>
              <span>Anı noktasını ortalayın</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelPinning();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a0aec0',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', zIndex: 1002 }}>
            <button 
              className="btn-primary" 
              style={{ padding: '0.85rem 2rem', borderRadius: '30px', boxShadow: 'var(--shadow-lg)', fontSize: '0.95rem' }}
              onClick={() => onConfirmPinLocation(centerCoords.lat, centerCoords.lng)}
            >
              Konumu Onayla
            </button>
          </div>
        </>
      )}

      {/* Floating Reaction Animation Portal */}
      {hearts.map(h => (
        <span 
          key={h.id} 
          className="floating-heart" 
          style={{ left: h.x, top: h.y }}
        >
          ❤️
        </span>
      ))}

      {/* Mobile Bottom Sheet Overlay */}
      {isMobile && selectedMobilePin && (() => {
        const pin = selectedMobilePin;
        const hasLiked = likesAndHugs[pin.id]?.liked || false;
        const hasHugged = likesAndHugs[pin.id]?.hugged || false;
        
        return (
          <div className="mobile-bottom-sheet-overlay" onClick={() => {
            setSelectedMobilePin(null);
            setOpenPinId(null);
          }}>
            <div className="mobile-bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
              <div className="bottom-sheet-drag-handle" onClick={() => {
                setSelectedMobilePin(null);
                setOpenPinId(null);
              }}></div>
              
              <div className="memory-popup-card" style={{ transform: 'none', padding: 0, boxShadow: 'none', border: 'none', background: 'transparent' }}>
                <div className="memory-popup-body" style={{ flexDirection: 'column', gap: '1rem' }}>
                  <div className="memory-popup-text-column">
                    <div className="memory-popup-text" style={{ maxHeight: 'none', fontSize: '1.25rem' }}>{pin.content}</div>
                    
                    <div className="memory-popup-meta" style={{ flexDirection: 'row', gap: '1rem', flexWrap: 'wrap' }}>
                      <span className="memory-popup-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        {pin.privacy_mode === 'private' && <><Lock size={12} /> Günlük</>}
                        {pin.privacy_mode === 'circle' && <><Users size={12} /> Çember</>}
                        {pin.privacy_mode === 'public' && <><Globe size={12} /> Açık</>}
                      </span>
                      <span className="memory-popup-date" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={12} /> {new Date(pin.memory_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    {pin.people && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.65rem' }}>
                        {JSON.parse(pin.people).map((person: string) => (
                          <span 
                            key={person} 
                            style={{ 
                              fontSize: '0.72rem', 
                              fontWeight: 600, 
                              background: 'rgba(90, 103, 216, 0.08)', 
                              color: 'var(--text-active)', 
                              padding: '0.2rem 0.6rem', 
                              borderRadius: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.15rem'
                            }}
                          >
                            <User size={10} /> {person}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {pin.image_url && (
                    <div className="memory-popup-image-column" style={{ width: '100%', height: '200px' }}>
                      <img 
                        src={pin.image_url} 
                        alt="Pin" 
                        className="memory-popup-image" 
                        style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                {pin.spotify_track_id && (
                  <TrackPlayer trackId={pin.spotify_track_id} isOpen={openPinId === pin.id} />
                )}

                <div className="memory-popup-actions" style={{ marginTop: '1.5rem', justifyContent: 'space-around' }}>
                  <button 
                    className={`memory-action-btn ${hasLiked ? 'active-like' : ''}`}
                    onClick={(e) => {
                      triggerReactionAnimation(e);
                      onLike(pin.id);
                    }}
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}
                  >
                    <Heart size={16} fill={hasLiked ? 'var(--color-public)' : 'none'} />
                    <span>Beğen ({pin.likes_count || 0})</span>
                  </button>

                  <button 
                    className={`memory-action-btn ${hasHugged ? 'active-hug' : ''}`}
                    onClick={(e) => {
                      triggerReactionAnimation(e);
                      onHug(pin.id);
                    }}
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}
                  >
                    <Smile size={16} />
                    <span>Sarıl ({pin.hugs_count || 0})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
