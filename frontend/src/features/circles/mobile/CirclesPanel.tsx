import React, { useState } from 'react';
import { Copy, Check, Users, Circle as CircleIcon } from 'lucide-react';
import { Circle } from '@/shared/types/types';
import { createCircle, fetchCircle } from '@/shared/api/api';

interface CirclesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  joinedCircles: Circle[];
  setJoinedCircles: React.Dispatch<React.SetStateAction<Circle[]>>;
  selectedCircleId: string | null;
  setSelectedCircleId: (id: string | null) => void;
}

export const CirclesPanel: React.FC<CirclesPanelProps> = ({
  isOpen,
  onClose: _onClose,
  joinedCircles,
  setJoinedCircles,
  selectedCircleId,
  setSelectedCircleId
}) => {
  const [newCircleName, setNewCircleName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      const newCircle = await createCircle(newCircleName);
      setJoinedCircles(prev => [...prev, newCircle]);
      setNewCircleName('');
      setSuccess(`"${newCircle.name}" oluşturuldu!`);
      setSelectedCircleId(newCircle.id);
    } catch (err) {
      setError('Çember oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleJoinCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setError(null);
    setSuccess(null);
    const code = joinCode.trim().toUpperCase();
    
    if (joinedCircles.some(c => c.id === code)) {
      setError('Bu çembere zaten katıldınız.');
      return;
    }

    try {
      const circle = await fetchCircle(code);
      setJoinedCircles(prev => [...prev, circle]);
      setJoinCode('');
      setSuccess(`"${circle.name}" çemberine başarıyla katıldınız!`);
      setSelectedCircleId(circle.id);
    } catch (err) {
      setError('Geçersiz çember kodu. Lütfen kontrol edin.');
    }
  };

  const copyToClipboard = (e: React.MouseEvent, code: string) => {
    e.stopPropagation(); // Prevent row click
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`mobile-page ${isOpen ? 'open' : ''}`}>
      <h1 className="mobile-large-title">Çemberler</h1>

      <div className="mobile-page-content">
        <p className="mobile-body" style={{ marginBottom: 'var(--mobile-spacing-lg)' }}>
          Sevgiliniz, aileniz veya en yakın arkadaş grubunuzla paylaştığınız konum bazlı anı kutuları oluşturun ya da davet koduyla katılın.
        </p>

        {error && (
          <div className="mobile-caption" style={{ color: 'var(--mobile-accent)', background: 'rgba(194, 75, 59, 0.1)', padding: 'var(--mobile-spacing-sm) var(--mobile-spacing-md)', borderRadius: 'var(--mobile-radius-sm)', marginBottom: 'var(--mobile-spacing-md)' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mobile-caption" style={{ color: '#34C759', background: 'rgba(52, 199, 89, 0.1)', padding: 'var(--mobile-spacing-sm) var(--mobile-spacing-md)', borderRadius: 'var(--mobile-radius-sm)', marginBottom: 'var(--mobile-spacing-md)' }}>
            {success}
          </div>
        )}

        <div style={{ marginBottom: 'var(--mobile-spacing-xl)' }}>
          <form onSubmit={handleJoinCircle} style={{ display: 'flex', gap: 'var(--mobile-spacing-sm)', marginBottom: 'var(--mobile-spacing-md)' }}>
            <input 
              type="text" 
              className="mobile-input" 
              placeholder="6 Haneli Çember Kodu" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
              style={{ textTransform: 'uppercase', flex: 1 }}
            />
            <button type="submit" className="mobile-button mobile-button-primary" style={{ width: 'auto' }}>
              Katıl
            </button>
          </form>

          <form onSubmit={handleCreateCircle} style={{ display: 'flex', gap: 'var(--mobile-spacing-sm)' }}>
            <input 
              type="text" 
              className="mobile-input" 
              placeholder="Yeni Çember Adı" 
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="mobile-button mobile-button-secondary" style={{ width: 'auto' }}>
              Oluştur
            </button>
          </form>
        </div>

        <h2 className="mobile-title">Çemberleriniz</h2>

        {joinedCircles.length === 0 ? (
          <div style={{ padding: 'var(--mobile-spacing-xl) 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--mobile-spacing-md)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--mobile-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mobile-text-tertiary)' }}>
              <Users size={32} />
            </div>
            <p className="mobile-body">
              Henüz bir çembere katılmadınız. Kendi anı kutunuzu oluşturarak veya bir davet koduyla katılarak başlayın.
            </p>
          </div>
        ) : (
          <div className="mobile-list">
            {joinedCircles.map(circle => {
              const isSelected = selectedCircleId === circle.id;
              return (
                <div 
                  key={circle.id} 
                  className="mobile-list-item"
                  onClick={() => setSelectedCircleId(isSelected ? null : circle.id)}
                >
                  <div className="mobile-list-icon" style={{ background: isSelected ? 'var(--mobile-accent)' : 'var(--mobile-bg)', borderRadius: 'var(--mobile-radius-sm)', color: isSelected ? '#FFF' : 'var(--mobile-text-secondary)' }}>
                    <CircleIcon size={16} fill={isSelected ? 'currentColor' : 'none'} />
                  </div>
                  
                  <div className="mobile-list-content">
                    <div className="mobile-list-title">{circle.name}</div>
                    <div className="mobile-list-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Kod: <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{circle.id}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mobile-spacing-md)' }}>
                    <button 
                      onClick={(e) => copyToClipboard(e, circle.id)}
                      style={{ background: 'none', border: 'none', padding: '8px', color: 'var(--mobile-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Kodu Kopyala"
                    >
                      {copiedCode === circle.id ? <Check size={18} color="#34C759" /> : <Copy size={18} />}
                    </button>
                    {isSelected && <Check size={20} color="var(--mobile-accent)" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};



