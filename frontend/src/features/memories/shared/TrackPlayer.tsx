import React from 'react';

export const TrackPlayer: React.FC<{ trackId: string; isOpen: boolean }> = ({ trackId, isOpen }) => {
  if (!isOpen || !trackId) return null;

  return (
    <div className="track-player-container" style={{ marginTop: '10px' }}>
      <iframe 
        scrolling="no" 
        frameBorder="0" 
        allowTransparency={true}
        src={`https://www.deezer.com/plugins/player?format=classic&autoplay=false&playlist=false&width=100%25&height=100&color=ef5466&layout=dark&size=medium&type=tracks&id=${trackId}&app_id=1`}
        width="100%" 
        height="100" 
        title="Deezer Player"
        style={{ borderRadius: '8px' }}
      ></iframe>
    </div>
  );
};
