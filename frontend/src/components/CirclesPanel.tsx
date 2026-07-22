import React, { useState } from 'react';
import { X, Plus, UserPlus, Copy, Check, Users } from 'lucide-react';
import { Circle } from '../types';
import { createCircle, fetchCircle } from '../services/api';

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
  onClose,
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
      setSuccess(`"${newCircle.name}" oluşturuldu! Kod: ${newCircle.id}`);
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

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`panel-drawer ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h2 className="panel-title">Çemberler</h2>
        <button className="panel-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flexGrow: 1, paddingRight: '4px' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Sevgiliniz, aileniz veya en yakın arkadaş grubunuzla paylaştığınız konum bazlı anı kutuları oluşturun ya da davet koduyla katılın.
        </p>

        {error && <div style={{ color: 'var(--color-public)', fontSize: '0.8rem', background: 'rgba(229, 62, 62, 0.05)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(229, 62, 62, 0.2)' }}>⚠️ {error}</div>}
        {success && <div style={{ color: 'green', fontSize: '0.8rem', background: 'rgba(0, 128, 0, 0.05)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(0, 128, 0, 0.2)' }}>✓ {success}</div>}

        {/* Join Circle */}
        <form onSubmit={handleJoinCircle} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="6 Haneli Çember Kodu" 
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={6}
            style={{ textTransform: 'uppercase' }}
          />
          <button type="submit" className="btn-primary" style={{ flex: '0 0 auto', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <UserPlus size={16} />
            Katıl
          </button>
        </form>

        {/* Create Circle */}
        <form onSubmit={handleCreateCircle} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Yeni Çember Adı" 
            value={newCircleName}
            onChange={(e) => setNewCircleName(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ flex: '0 0 auto', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Plus size={16} />
            Oluştur
          </button>
        </form>

        <div className="divider">Çemberleriniz</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {joinedCircles.map(circle => {
            const isSelected = selectedCircleId === circle.id;
            return (
              <div 
                key={circle.id} 
                className={`circle-card ${isSelected ? 'active' : ''}`}
                style={{ 
                  borderLeft: isSelected ? '4px solid var(--color-circle)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(221, 107, 32, 0.03)' : 'transparent'
                }}
                onClick={() => setSelectedCircleId(isSelected ? null : circle.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="circle-card-title">{circle.name}</div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(circle.id);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem' }}
                  >
                    {copiedCode === circle.id ? <Check size={12} color="green" /> : <Copy size={12} />}
                    <span>{copiedCode === circle.id ? 'Kopyalandı' : circle.id}</span>
                  </button>
                </div>
                <div className="circle-card-desc" style={{ marginTop: '0.25rem' }}>
                  Kod: <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{circle.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="circle-card-count" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={12} />
                    <span>Çember aktif</span>
                  </span>
                  {isSelected && <span style={{ fontSize: '0.72rem', color: 'var(--color-circle)', fontWeight: 600 }}>Filtrelenmiş</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
