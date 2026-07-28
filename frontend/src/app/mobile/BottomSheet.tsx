import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullScreen?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children, fullScreen = false }) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="bottom-sheet-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 9998,
          backdropFilter: 'blur(2px)'
        }}
      />
      <div 
        ref={sheetRef}
        className={`bottom-sheet ${fullScreen ? 'full-screen' : ''}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          zIndex: 9999,
          borderTopLeftRadius: fullScreen ? '0' : '20px',
          borderTopRightRadius: fullScreen ? '0' : '20px',
          padding: '1rem',
          maxHeight: fullScreen ? '100dvh' : '85dvh',
          height: fullScreen ? '100dvh' : 'auto',
          overflowY: 'auto',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          {title && <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{title}</h2>}
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(0,0,0,0.05)', 
              border: 'none', 
              borderRadius: '50%', 
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
};


