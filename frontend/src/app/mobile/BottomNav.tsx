import React from 'react';
import { Map, CircleDashed, Plus, BookOpen, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'map' | 'circles' | 'memories' | 'profile';
  setActiveTab: (tab: 'map' | 'circles' | 'memories' | 'profile') => void;
  onAddClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onAddClick }) => {
  return (
    <div className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => setActiveTab('map')}
      >
        <Map size={24} />
        <span>Harita</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'circles' ? 'active' : ''}`}
        onClick={() => setActiveTab('circles')}
      >
        <CircleDashed size={24} />
        <span>Çemberler</span>
      </button>

      <button 
        className="nav-item add-btn"
        onClick={onAddClick}
      >
        <div className="add-icon-wrapper">
          <Plus size={28} color="white" />
        </div>
      </button>

      <button 
        className={`nav-item ${activeTab === 'memories' ? 'active' : ''}`}
        onClick={() => setActiveTab('memories')}
      >
        <BookOpen size={24} />
        <span>Günlük</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        <User size={24} />
        <span>Sen</span>
      </button>
    </div>
  );
};


