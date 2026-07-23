import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Circle } from '../types';

interface NewPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  joinedCircles: Circle[];
  existingPeople: string[];
  onSubmit: (data: {
    content: string;
    privacy_mode: 'public' | 'circle' | 'private';
    circle_id: string | null;
    memory_date: string;
    image: File | null;
    spotify_track_id: string | null;
    people: string | null;
  }) => Promise<void>;
}

export const NewPinModal: React.FC<NewPinModalProps> = ({
  isOpen,
  onClose,
  joinedCircles,
  onSubmit
}) => {
  const [content, setContent] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'public' | 'circle' | 'private'>('public');
  const [circleId, setCircleId] = useState<string | null>(joinedCircles[0]?.id || null);
  const [memoryDate] = useState(new Date().toISOString().substring(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasDraft, setHasDraft] = useState(false);

  // Check for unsaved drafts when opening the modal
  useEffect(() => {
    if (isOpen) {
      const draftContent = localStorage.getItem('mb_draft_content');
      if (draftContent && draftContent.trim()) {
        setHasDraft(true);
      } else {
        setHasDraft(false);
      }
      setError(null);
    }
  }, [isOpen]);

  const loadDraft = () => {
    const draftContent = localStorage.getItem('mb_draft_content');
    const draftPrivacy = localStorage.getItem('mb_draft_privacy');
    const draftCircleId = localStorage.getItem('mb_draft_circle_id');

    if (draftContent) setContent(draftContent);
    if (draftPrivacy) setPrivacyMode(draftPrivacy as any);
    if (draftCircleId) setCircleId(draftCircleId);
    setHasDraft(false);
  };

  const clearDraft = () => {
    localStorage.removeItem('mb_draft_content');
    localStorage.removeItem('mb_draft_privacy');
    localStorage.removeItem('mb_draft_circle_id');
    setHasDraft(false);
    
    // Reset state
    setContent('');
    setPrivacyMode('public');
    setCircleId(joinedCircles[0]?.id || null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (privacyMode === 'circle' && !circleId) {
      setError('Lütfen paylaşmak istediğiniz çemberi seçin veya yeni bir çembere katılın.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        content,
        privacy_mode: privacyMode,
        circle_id: privacyMode === 'circle' ? circleId : null,
        memory_date: memoryDate,
        image: null,
        spotify_track_id: null,
        people: null
      });
      clearDraft();
      onClose();
    } catch (err) {
      setError('Anı eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button 
          className="panel-close-btn" 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px' }}
        >
          <X size={20} />
        </button>

        <h2 className="panel-title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Anı Ekle</h2>

        {hasDraft && (
          <div style={{
            background: 'rgba(235, 143, 62, 0.08)',
            border: '1px dashed var(--color-circle)',
            borderRadius: '12px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            pointerEvents: 'auto'
          }}>
            <span>📝 Yarım kalan bir anı taslağınız var.</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                type="button" 
                onClick={loadDraft}
                style={{ background: 'var(--text-active)', color: '#fff', border: 'none', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Taslağı Yükle
              </button>
              <button 
                type="button" 
                onClick={clearDraft}
                style={{ background: 'none', color: 'var(--text-muted)', border: '1px solid rgba(44,44,44,0.15)', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Temizle
              </button>
            </div>
          </div>
        )}

        {error && <div style={{ color: 'var(--color-public)', fontSize: '0.8rem', marginBottom: '1rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="form-group">
            <label className="form-label">Anınız (Notunuz)</label>
            <textarea 
              className="form-textarea"
              placeholder="Burada ne yaşandı? Anılarınızı, itiraflarınızı, şiirlerinizi yazın..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                localStorage.setItem('mb_draft_content', e.target.value);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gizlilik Modu</label>
            <div className="form-select-group">
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'private' ? 'active-private' : ''}`}
                onClick={() => {
                  setPrivacyMode('private');
                  localStorage.setItem('mb_draft_privacy', 'private');
                }}
              >
                🔒 Sadece Ben
              </button>
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'circle' ? 'active-circle' : ''}`}
                onClick={() => {
                  setPrivacyMode('circle');
                  localStorage.setItem('mb_draft_privacy', 'circle');
                }}
              >
                👥 Çember
              </button>
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'public' ? 'active-public' : ''}`}
                onClick={() => {
                  setPrivacyMode('public');
                  localStorage.setItem('mb_draft_privacy', 'public');
                }}
              >
                🌍 Açık (Public)
              </button>
            </div>
          </div>

          {privacyMode === 'circle' && (
            <div className="form-group">
              <label className="form-label">Hangi Çemberde Paylaşılsın?</label>
              {joinedCircles.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-circle)', background: 'rgba(221,107,32,0.05)', padding: '0.5rem', borderRadius: '8px', border: '1px dashed var(--color-circle)' }}>
                  Katıldığınız bir çember bulunamadı. Lütfen önce sol menüdeki "Çemberler" panelinden bir çember oluşturun veya katılın.
                </div>
              ) : (
                <select 
                  className="form-input"
                  value={circleId || ''}
                  onChange={(e) => {
                    setCircleId(e.target.value);
                    localStorage.setItem('mb_draft_circle_id', e.target.value);
                  }}
                  required
                >
                  <option value="" disabled>Seçiniz...</option>
                  {joinedCircles.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="form-buttons">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>İptal</button>
            <button type="submit" className="btn-primary" disabled={loading || (privacyMode === 'circle' && joinedCircles.length === 0)}>
              {loading ? 'Kaydediliyor...' : 'Pini Bırak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
