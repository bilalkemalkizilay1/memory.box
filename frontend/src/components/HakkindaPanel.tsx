import React from 'react';
import { X, Lock, Users, Eye } from 'lucide-react';

interface HakkindaPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HakkindaPanel: React.FC<HakkindaPanelProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`panel-drawer ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h2 className="panel-title">Hakkında</h2>
        <button className="panel-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
        <p style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-active)' }}>
          Spatial Memory & Location-Based Journaling Platform
        </p>

        <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.88rem', lineHeight: '1.6' }}>
          <strong>Vizyonumuz:</strong> İnsanların dijital anılarını fiziksel mekanların bağlamıyla birleştirerek, lokasyon bazlı kişisel bir günlük ve anonim bir sosyal hafıza ağı yaratmak.
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nasıl Anı Bırakılır?</h3>
          <ol style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.25rem' }}>
            <li>Haritayı gezerek veya arama barını kullanarak anı bırakmak istediğiniz yere gidin.</li>
            <li>Sol menüden <strong>+ Yeni Anı</strong> seçeneğine tıklayın. Haritanın ortasında bir hedef imleci belirecektir.</li>
            <li>İmleci tam konuma yerleştirin ve <strong>"Konumu Onayla"</strong> butonuna basın.</li>
            <li>Metninizi yazın, tarih seçin (Zaman Makinesi), fotoğraf yükleyin ve gizlilik modunu seçip <strong>Pini Bırak</strong>'a tıklayın.</li>
          </ol>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Gizlilik Modları</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(49, 130, 206, 0.1)', color: 'var(--color-private)', padding: '0.25rem', borderRadius: '6px', marginTop: '0.15rem' }}>
                <Lock size={14} />
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-private)' }}>Günlük (Sadece Ben)</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Anılarınız sadece kendi tarayıcınızda (yerel olarak) saklanır ve dışa tamamen kapalıdır.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(221, 107, 32, 0.1)', color: 'var(--color-circle)', padding: '0.25rem', borderRadius: '6px', marginTop: '0.15rem' }}>
                <Users size={14} />
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-circle)' }}>Çember (Paylaşımlı)</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sadece 6 haneli özel kodu paylaştığınız kişilerle ortaklaşa görebileceğiniz paylaşımlı anı alanıdır.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(229, 62, 62, 0.1)', color: 'var(--color-public)', padding: '0.25rem', borderRadius: '6px', marginTop: '0.15rem' }}>
                <Eye size={14} />
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-public)' }}>Açık (Anonim/Public)</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Konumla ilgili herkesin okuyabileceği anonim hikayeler, şiirler ve itiraflar. (Beğen ve Sarıl etkileşimleri aktiftir).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
