import React from 'react';
import { useAppStore } from '../../store/appStore.js';

export default function DiscoveryModal() {
  const discoveryData = useAppStore(s => s.discoveryModalData);
  const closeDiscoveryModal = useAppStore(s => s.closeDiscoveryModal);

  if (!discoveryData) return null;

  return (
    <div className="discovery-modal-overlay open" onClick={closeDiscoveryModal}>
      <div className="discovery-card" onClick={e => e.stopPropagation()}>
        <div className="discovery-badge">DEEP SPACE DISCOVERY</div>
        <div className="discovery-icon">{discoveryData.icon || '🌌'}</div>
        <div className="discovery-title">{discoveryData.title}</div>
        <div className="discovery-sub">{discoveryData.catalog || 'CATALOG: HY-2026 • 12,000 LIGHT YEARS'}</div>
        <div className="discovery-body">{discoveryData.body}</div>
        <button className="discovery-close-btn" onClick={closeDiscoveryModal}>
          Keep Exploring ✦
        </button>
      </div>
    </div>
  );
}
