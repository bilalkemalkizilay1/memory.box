import React, { useState } from 'react';
import { PlusCircle, Users, BookOpen, User, HelpCircle, Map, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activePanel: 'cemberler' | 'gunluk' | 'sen' | 'hakkinda' | null;
  setActivePanel: (panel: 'cemberler' | 'gunluk' | 'sen' | 'hakkinda' | null) => void;
  isPinningMode: boolean;
  setIsPinningMode: (val: boolean) => void;
  onGeneralMapClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePanel,
  setActivePanel,
  isPinningMode,
  setIsPinningMode,
  onGeneralMapClick
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`sidebar glass ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '2.5rem' }}>
        {!isCollapsed && <h1 className="logo" style={{ margin: 0 }}>Anı Kutusu</h1>}
        {isCollapsed && <span className="logo-icon" style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-active)' }}>A</span>}
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '50%',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="menu-list">
          <li 
            className={`menu-item ${isPinningMode ? 'active' : ''}`}
            onClick={() => {
              setActivePanel(null);
              setIsPinningMode(!isPinningMode);
            }}
            title={isCollapsed ? 'Yeni Anı' : ''}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0.85rem' : '0.85rem 1.15rem' }}
          >
            <PlusCircle className="menu-item-icon" />
            {!isCollapsed && <span>Yeni Anı</span>}
          </li>

          <li 
            className={`menu-item ${!isPinningMode && activePanel === null ? 'active' : ''}`}
            onClick={() => {
              setIsPinningMode(false);
              onGeneralMapClick();
            }}
            title={isCollapsed ? 'Genel Harita' : ''}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0.85rem' : '0.85rem 1.15rem' }}
          >
            <Map className="menu-item-icon" />
            {!isCollapsed && <span>Genel Harita</span>}
          </li>

          <li 
            className={`menu-item ${activePanel === 'cemberler' ? 'active' : ''}`}
            onClick={() => {
              setIsPinningMode(false);
              setActivePanel(activePanel === 'cemberler' ? null : 'cemberler');
            }}
            title={isCollapsed ? 'Çemberler' : ''}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0.85rem' : '0.85rem 1.15rem' }}
          >
            <Users className="menu-item-icon" />
            {!isCollapsed && <span>Çemberler</span>}
          </li>

          <li 
            className={`menu-item ${activePanel === 'gunluk' ? 'active' : ''}`}
            onClick={() => {
              setIsPinningMode(false);
              setActivePanel(activePanel === 'gunluk' ? null : 'gunluk');
            }}
            title={isCollapsed ? 'Günlük' : ''}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0.85rem' : '0.85rem 1.15rem' }}
          >
            <BookOpen className="menu-item-icon" />
            {!isCollapsed && <span>Günlük</span>}
          </li>

          <li 
            className={`menu-item ${activePanel === 'sen' ? 'active' : ''}`}
            onClick={() => {
              setIsPinningMode(false);
              setActivePanel(activePanel === 'sen' ? null : 'sen');
            }}
            title={isCollapsed ? 'Sen' : ''}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0.85rem' : '0.85rem 1.15rem' }}
          >
            <User className="menu-item-icon" />
            {!isCollapsed && <span>Sen</span>}
          </li>

          <li 
            className={`menu-item ${activePanel === 'hakkinda' ? 'active' : ''}`}
            onClick={() => {
              setIsPinningMode(false);
              setActivePanel(activePanel === 'hakkinda' ? null : 'hakkinda');
            }}
            title={isCollapsed ? 'Hakkında' : ''}
            style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '0.85rem' : '0.85rem 1.15rem' }}
          >
            <HelpCircle className="menu-item-icon" />
            {!isCollapsed && <span>Hakkında</span>}
          </li>
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <p>© Anı Kutusu Ltd.</p>
          <p style={{ marginTop: '4px', cursor: 'pointer' }}>Gizlilik · Şartlar · Çerezler</p>
        </div>
      )}
    </div>
  );
};
