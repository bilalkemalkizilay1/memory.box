import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Memory } from '@shared/types/types';
import { Crosshair, X, Navigation } from 'lucide-react';

interface MapCanvasProps {
  memories: Memory[];
  isPinningMode: boolean;
  onConfirmPinLocation: (lat: number, lng: number) => void;
  onCancelPinning: () => void;
  mapRef: React.MutableRefObject<any>;
  onMarkerClick?: (memory: Memory) => void;
  renderMarkerPopup?: (memory: Memory) => React.ReactNode;
  children?: React.ReactNode; // For any extra floating elements like Mobile Bottom Sheet
}

// Custom DivIcons for each privacy type
export const createCustomIcon = (mode: 'private' | 'circle' | 'public') => {
  let color = 'var(--color-private)';
  if (mode === 'circle') color = 'var(--color-circle)';
  if (mode === 'public') color = 'var(--color-public)';

  return L.divIcon({
    className: 'custom-memory',
    html: `<div class="memory-stamp" style="background-color: ${color};"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
};

const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="custom-cluster"><span>${count}</span></div>`,
    className: 'custom-cluster-container',
    iconSize: L.point(32, 32, true)
  });
};

const MapController: React.FC<{ mapRef: React.MutableRefObject<any> }> = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
};

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

const MapBoundsTracker: React.FC<{ 
  setVisibleBounds: (bounds: L.LatLngBounds) => void 
}> = ({ setVisibleBounds }) => {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      setVisibleBounds(map.getBounds());
    }
  });
  useEffect(() => {
    setVisibleBounds(map.getBounds());
  }, [map, setVisibleBounds]);
  return null;
};

export const MapCanvas: React.FC<MapCanvasProps> = ({
  memories,
  isPinningMode,
  onConfirmPinLocation,
  onCancelPinning,
  mapRef,
  onMarkerClick,
  renderMarkerPopup,
  children
}) => {
  // Dither identical coordinates slightly so cluster spiderfies them perfectly
  const ditheredMemories = React.useMemo(() => {
    const coordsCount: Record<string, number> = {};
    return memories.map(m => {
      const key = `${m.lat},${m.lng}`;
      if (coordsCount[key]) {
        coordsCount[key]++;
        return {
          ...m,
          lat: m.lat + (Math.random() - 0.5) * 0.0001,
          lng: m.lng + (Math.random() - 0.5) * 0.0001
        };
      }
      coordsCount[key] = 1;
      return m;
    });
  }, [memories]);

  const initialPosition: [number, number] = [41.028, 29.000];
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number }>({ lat: 41.028, lng: 29.000 });
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGpsError("Tarayıcınız konum servislerini desteklemiyor.");
      return;
    }
    setGpsError(null);
    setGpsAccuracy(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(Math.round(accuracy));
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15.5);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("Konum izni reddedildi. Haritada gezerek manuel memory bırakabilirsiniz.");
        } else {
          setGpsError("Konum belirlenirken hata oluştu.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const filteredPins = useMemo(() => {
    if (!visibleBounds) return ditheredMemories;
    return ditheredMemories.filter(memory => {
      return visibleBounds.contains([memory.lat, memory.lng]);
    });
  }, [ditheredMemories, visibleBounds]);

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController mapRef={mapRef} />
        <CenterTracker isPinningMode={isPinningMode} setCenterCoords={setCenterCoords} />
        <MapBoundsTracker setVisibleBounds={setVisibleBounds} />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          showCoverageOnHover={false}
          maxClusterRadius={40}
          spiderfyOnMaxZoom={true}
        >
          {filteredPins.map(memory => (
            <Marker
              key={memory.id}
              position={[memory.lat, memory.lng]}
              icon={createCustomIcon(memory.privacy_mode)}
              eventHandlers={{
                click: () => onMarkerClick?.(memory)
              }}
            >
              {renderMarkerPopup?.(memory)}
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

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
                  background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', display: 'flex', alignItems: 'center', padding: 0
                }}
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

      {gpsError && (
        <div className="gps-status-banner" style={{ borderLeft: '3px solid var(--color-public)', pointerEvents: 'auto' }}>
          <span>⚠️ {gpsError}</span>
          <button onClick={() => setGpsError(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginLeft: '0.5rem' }}>×</button>
        </div>
      )}

      {gpsAccuracy !== null && gpsAccuracy > 50 && (
        <div className="gps-status-banner" style={{ borderLeft: '3px solid #dd6b20', pointerEvents: 'auto' }}>
          <span>⚠️ Düşük GPS Hassasiyeti ({gpsAccuracy}m). İhtiyaç halinde memory yerini manuel ortalayın.</span>
          <button onClick={() => setGpsAccuracy(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginLeft: '0.5rem' }}>×</button>
        </div>
      )}

      {gpsAccuracy !== null && gpsAccuracy <= 50 && (
        <div className="gps-status-banner" style={{ borderLeft: '3px solid var(--color-circle)', pointerEvents: 'auto' }}>
          <span>✅ Konum doğrulandı (Hassasiyet: {gpsAccuracy}m).</span>
          <button onClick={() => setGpsAccuracy(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginLeft: '0.5rem' }}>×</button>
        </div>
      )}

      <button type="button" className="map-locate-btn" onClick={handleLocateUser} title="Konumumu Bul">
        <Navigation size={20} />
      </button>

      {children}
    </div>
  );
};
