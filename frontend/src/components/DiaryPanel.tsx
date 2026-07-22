import React, { useState } from 'react';
import { X, LogIn, ShieldCheck, BookOpen } from 'lucide-react';
import { Pin } from '../types';

interface DiaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  privatePins: Pin[];
  onPinClick: (pin: Pin) => void;
  userProfile: { name: string; email: string } | null;
  setUserProfile: (profile: { name: string; email: string } | null) => void;
}

export const DiaryPanel: React.FC<DiaryPanelProps> = ({
  isOpen,
  onClose,
  privatePins,
  onPinClick,
  userProfile,
  setUserProfile
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setUserProfile({
      name: name || email.split('@')[0],
      email
    });
  };

  const handleLogout = () => {
    setUserProfile(null);
  };

  return (
    <div className={`panel-drawer ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h2 className="panel-title">Günlük</h2>
        <button className="panel-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {!userProfile ? (
        <div className="auth-panel" style={{ overflowY: 'auto' }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Anılarınızın bir yuvası olmalı. İşte kalacakları yer burası.
          </p>

          <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color="var(--color-private)" /> Neden hesap açmalısınız?
            </h3>
            <ul className="auth-bullet-list">
              <li>Anılarınızı dünyayla paylaşın</li>
              <li>Anılarınızı cihazlar arasında güvende tutun</li>
              <li>Kendi özel günlüğünüz</li>
              <li>Çemberlere ve paylaşılan anı alanlarına katılın</li>
            </ul>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {isRegistering && (
              <div className="form-group">
                <label className="form-label">Ad Soyad / Nickname</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nick" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">E-posta</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="ornek@domain.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Şifre</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <LogIn size={18} />
              <span>{isRegistering ? 'Hesap Oluştur' : 'Giriş Yap'}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isRegistering ? 'Zaten hesabınız var mı? ' : "Anı Kutusu'na yeni misiniz? "}
            </span>
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              style={{ background: 'none', border: 'none', color: 'var(--text-active)', fontWeight: 600, cursor: 'pointer' }}
            >
              {isRegistering ? 'Giriş Yap' : 'Hesap Oluştur'}
            </button>
          </div>

          <div className="divider">veya</div>

          <button className="btn-oauth" onClick={() => setUserProfile({ name: 'Apple Kullanıcısı', email: 'apple@user.local' })}>
            <span style={{ fontWeight: 'bold' }}></span> Apple ile devam et
          </button>
          <button className="btn-oauth" onClick={() => setUserProfile({ name: 'Google Kullanıcısı', email: 'google@user.local' })}>
            <span style={{ color: '#4285F4', fontWeight: 'bold' }}>G</span> Google ile devam et
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Giriş yapıldı:</p>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{userProfile.name}</p>
            </div>
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              Çıkış Yap
            </button>
          </div>

          <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem' }}>Kişisel Anılarınız ({privatePins.length})</h3>
          
          <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '4px' }}>
            {privatePins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <BookOpen size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.88rem' }}>Henüz kişisel bir anı pinlemediniz.</p>
                <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Sol menüdeki "+ Yeni Anı" butonunu kullanarak "Sadece Ben" modunda anı ekleyebilirsiniz.</p>
              </div>
            ) : (
              privatePins.map(pin => (
                <div 
                  key={pin.id} 
                  className="circle-card" 
                  onClick={() => onPinClick(pin)}
                  style={{ borderLeft: '4px solid var(--color-private)' }}
                >
                  <div className="circle-card-title">{pin.content.substring(0, 30)}{pin.content.length > 30 ? '...' : ''}</div>
                  <div className="circle-card-desc">{pin.content}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📅 {new Date(pin.memory_date).toLocaleDateString('tr-TR')}</span>
                    <span>📍 {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
