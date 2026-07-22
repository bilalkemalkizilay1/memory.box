import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
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

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
    };
  });
};

export const NewPinModal: React.FC<NewPinModalProps> = ({
  isOpen,
  onClose,
  joinedCircles,
  existingPeople,
  onSubmit
}) => {
  const [content, setContent] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'public' | 'circle' | 'private'>('public');
  const [circleId, setCircleId] = useState<string | null>(joinedCircles[0]?.id || null);
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().substring(0, 10));
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [songQuery, setSongQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [peopleList, setPeopleList] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPerson = () => {
    const name = personInput.trim();
    if (name && !peopleList.includes(name)) {
      setPeopleList([...peopleList, name]);
    }
    setPersonInput('');
  };

  const handleRemovePerson = (nameToRemove: string) => {
    setPeopleList(peopleList.filter(p => p !== nameToRemove));
  };

  const handleSearchSongs = async () => {
    if (!songQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/songs/search?q=${encodeURIComponent(songQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
      if (data.length === 0) {
        setError('Şarkı bulunamadı.');
      }
    } catch (err) {
      setError('Şarkı aranırken bir hata oluştu.');
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (privacyMode === 'circle' && !circleId) {
      setError('Lütfen paylaşmak istediğiniz çemberi seçin veya yeni bir çembere katılın.');
      return;
    }

    const trackId = selectedSong ? selectedSong.id : null;

    setLoading(true);
    setError(null);
    try {
      let finalImage = image;
      if (image) {
        // Compress the image before uploading to bypass the 4.5MB server limit
        finalImage = await compressImage(image);
      }
      await onSubmit({
        content,
        privacy_mode: privacyMode,
        circle_id: privacyMode === 'circle' ? circleId : null,
        memory_date: memoryDate,
        image: finalImage,
        spotify_track_id: trackId,
        people: peopleList.length > 0 ? JSON.stringify(peopleList) : null
      });
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

        {error && <div style={{ color: 'var(--color-public)', fontSize: '0.8rem', marginBottom: '1rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="form-group">
            <label className="form-label">Anınız (Notunuz)</label>
            <textarea 
              className="form-textarea"
              placeholder="Burada ne yaşandı? Anılarınızı, itiraflarınızı, şiirlerinizi yazın..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tarih (Zaman Makinesi)</label>
            <input 
              type="date"
              className="form-input"
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
              max={new Date().toISOString().substring(0, 10)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gizlilik Modu</label>
            <div className="form-select-group">
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'private' ? 'active-private' : ''}`}
                onClick={() => setPrivacyMode('private')}
              >
                🔒 Sadece Ben
              </button>
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'circle' ? 'active-circle' : ''}`}
                onClick={() => setPrivacyMode('circle')}
              >
                👥 Çember
              </button>
              <button 
                type="button"
                className={`privacy-toggle-btn ${privacyMode === 'public' ? 'active-public' : ''}`}
                onClick={() => setPrivacyMode('public')}
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
                  onChange={(e) => setCircleId(e.target.value)}
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

          <div className="form-group">
            <label className="form-label">Şarkı Ekle (Müzik)</label>
            {selectedSong ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                background: 'rgba(255,255,255,0.7)', 
                backdropFilter: 'blur(10px)',
                padding: '0.65rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--card-shadow)'
              }}>
                <img 
                  src={selectedSong.cover} 
                  alt="Cover" 
                  style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedSong.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedSong.artist}
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedSong(null)}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: 'rgb(239, 68, 68)', 
                    border: 'none', 
                    padding: '0.35rem 0.65rem', 
                    borderRadius: '8px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    cursor: 'pointer' 
                  }}
                >
                  Kaldır
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Şarkı veya sanatçı ara... (Örn: Duman Köprüaltı)"
                    value={songQuery}
                    onChange={(e) => setSongQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSongs();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="btn-primary"
                    onClick={handleSearchSongs}
                    disabled={searching || !songQuery.trim()}
                    style={{ padding: '0 1rem', flexShrink: 0, height: '42px', borderRadius: '10px' }}
                  >
                    {searching ? '...' : 'Ara'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div style={{ 
                    maxHeight: '180px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {searchResults.map((track) => (
                      <div 
                        key={track.id}
                        onClick={() => {
                          setSelectedSong(track);
                          setSearchResults([]);
                          setSongQuery('');
                        }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          padding: '0.5rem', 
                          borderBottom: '1px solid var(--border-color)', 
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <img 
                          src={track.cover} 
                          alt="Cover" 
                          style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} 
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {track.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {track.artist}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Kişileri Etiketle (Nickname veya İsim)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="text"
                className="form-input"
                placeholder="Örn: kemalkizilay0, Zeynep..."
                value={personInput}
                onChange={(e) => setPersonInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPerson();
                  }
                }}
              />
              <button 
                type="button"
                className="btn-primary"
                onClick={handleAddPerson}
                style={{ padding: '0 1rem', height: '42px', borderRadius: '10px' }}
              >
                Ekle
              </button>
            </div>

            {/* Autocomplete Suggestions */}
            {(() => {
              const suggestions = existingPeople.filter(person => 
                person.toLowerCase().includes(personInput.toLowerCase()) &&
                !peopleList.includes(person)
              );
              if (suggestions.length === 0) return null;
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Önerilenler:</span>
                  {suggestions.slice(0, 8).map(person => (
                    <button 
                      key={person} 
                      type="button"
                      onClick={() => {
                        setPeopleList([...peopleList, person]);
                        setPersonInput('');
                      }}
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600, 
                        padding: '0.2rem 0.5rem', 
                        background: '#edf2f7', 
                        color: '#4a5568', 
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#edf2f7'}
                    >
                      + {person}
                    </button>
                  ))}
                </div>
              );
            })()}
            {peopleList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {peopleList.map(person => (
                  <span 
                    key={person} 
                    style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      padding: '0.25rem 0.65rem', 
                      background: 'rgba(90, 103, 216, 0.1)', 
                      color: 'var(--text-active)', 
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {person}
                    <button 
                      type="button"
                      onClick={() => handleRemovePerson(person)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        padding: 0, 
                        color: 'red', 
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        marginLeft: '0.15rem'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Fotoğraf Ekle</label>
            <div 
              className="file-upload-container"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="file-upload-preview" />
              ) : (
                <>
                  <Upload className="file-upload-icon" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tıklayıp Fotoğraf Seçin</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Maksimum 1 görsel</span>
                </>
              )}
            </div>
          </div>

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
