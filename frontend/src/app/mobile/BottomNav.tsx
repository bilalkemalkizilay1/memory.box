import React from 'react';
import { Book, Map, Plus, CircleDashed, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'today' | 'map' | 'circles' | 'profile';
  setActiveTab: (tab: 'today' | 'map' | 'circles' | 'profile') => void;
  onAddClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onAddClick }) => {
  return (
    <div className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'today' ? 'active' : ''}`}
        onClick={() => setActiveTab('today')}
      >
        <Book size={24} />
        <span>Today</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => setActiveTab('map')}
      >
        <Map size={24} />
        <span>Map</span>
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
        className={`nav-item ${activeTab === 'circles' ? 'active' : ''}`}
        onClick={() => setActiveTab('circles')}
      >
        <CircleDashed size={24} />
        <span>Circles</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
      >
        <User size={24} />
        <span>Profile</span>
      </button>
    </div>
  );
};

