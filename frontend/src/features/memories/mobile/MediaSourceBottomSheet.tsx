import React, { useEffect, useState } from 'react';
import { Camera, Image as ImageIcon, Edit3, X } from 'lucide-react';

interface MediaSourceBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onSelectTextOnly: () => void;
}

export const MediaSourceBottomSheet: React.FC<MediaSourceBottomSheetProps> = ({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
  onSelectTextOnly
}) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className={`bottom-sheet-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className={`bottom-sheet-content ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="bottom-sheet-header">
          <h3>Nasıl başlamak istersin?</h3>
          <button className="bottom-sheet-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="bottom-sheet-body">
          <button className="media-source-btn" onClick={() => { onSelectCamera(); onClose(); }}>
            <div className="media-source-icon camera">
              <Camera size={24} />
            </div>
            <div className="media-source-text">
              <h4>Fotoğraf Çek</h4>
              <p>O anı ölümsüzleştir</p>
            </div>
          </button>
          
          <button className="media-source-btn" onClick={() => { onSelectGallery(); onClose(); }}>
            <div className="media-source-icon gallery">
              <ImageIcon size={24} />
            </div>
            <div className="media-source-text">
              <h4>Galeriden Seç</h4>
              <p>Geçmişten bir anı ekle</p>
            </div>
          </button>

          <button className="media-source-btn text-only" onClick={() => { onSelectTextOnly(); onClose(); }}>
            <div className="media-source-icon text">
              <Edit3 size={24} />
            </div>
            <div className="media-source-text">
              <h4>Sadece Yazı</h4>
              <p>Düşüncelerini not et</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
