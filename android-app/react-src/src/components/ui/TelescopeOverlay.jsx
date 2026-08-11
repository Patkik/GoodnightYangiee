import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore.js';

export default function TelescopeOverlay() {
  const isTelescopeActive = useAppStore(s => s.isTelescopeActive);
  const closeTelescope = useAppStore(s => s.closeTelescope);
  const lockedTarget = useAppStore(s => s.lockedTarget);
  const openDiscoveryModal = useAppStore(s => s.openDiscoveryModal);
  const setTelescopePan = useAppStore(s => s.setTelescopePan);

  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };

    setTelescopePan(prev => ({
      x: Math.max(-400, Math.min(400, prev.x + dx * 0.8)),
      y: Math.max(-300, Math.min(300, prev.y + dy * 0.8)),
    }));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  if (!isTelescopeActive) return null;

  return (
    <div
      className="telescope-overlay active"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className={`scope-lens-viewport ${lockedTarget ? 'target-locked' : ''}`}>
        {/* Vector SVG Scope Reticle */}
        <svg className="scope-reticle-svg" viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="185" className="reticle-ring-outer" />
          <circle cx="200" cy="200" r="170" className="reticle-ring-inner" strokeDasharray="4 4" />
          <circle cx="200" cy="200" r="95" className="reticle-ring-center" strokeDasharray="2 4" />
          
          <line x1="20" y1="200" x2="160" y2="200" className="reticle-line" />
          <line x1="240" y1="200" x2="380" y2="200" className="reticle-line" />
          <line x1="200" y1="20" x2="200" y2="160" className="reticle-line" />
          <line x1="200" y1="240" x2="200" y2="380" className="reticle-line" />
          
          <rect x="186" y="186" width="28" height="28" className="reticle-target-box" />
          <circle cx="200" cy="200" r="3" className="reticle-dot" />

          {/* Tick marks */}
          <line x1="170" y1="200" x2="170" y2="205" className="tick-mark" />
          <line x1="140" y1="200" x2="140" y2="208" className="tick-mark" />
          <line x1="110" y1="200" x2="110" y2="205" className="tick-mark" />
          <line x1="230" y1="200" x2="230" y2="205" className="tick-mark" />
          <line x1="260" y1="200" x2="260" y2="208" className="tick-mark" />
          <line x1="290" y1="200" x2="290" y2="205" className="tick-mark" />

          <line x1="200" y1="170" x2="205" y2="170" className="tick-mark" />
          <line x1="200" y1="140" x2="208" y2="140" className="tick-mark" />
          <line x1="200" y1="110" x2="205" y2="110" className="tick-mark" />
          <line x1="200" y1="230" x2="205" y2="230" className="tick-mark" />
          <line x1="200" y1="260" x2="208" y2="260" className="tick-mark" />
          <line x1="200" y1="290" x2="205" y2="290" className="tick-mark" />
        </svg>

        {/* Lens Glare */}
        <div className="lens-glare" />

        {/* Scope Telemetry HUD */}
        <div className="scope-hud top-left">
          <div className="hud-label">OBSERVATION MODE</div>
          <div className="hud-val">DEEP SPACE INFRARED</div>
        </div>
        <div className="scope-hud top-right">
          <div className="hud-label">OPTICAL ZOOM</div>
          <div className="hud-val">3.5x MAGNIFICATION</div>
        </div>
        <div className="scope-hud bottom-left">
          <div className="hud-label">TARGET SENSORS</div>
          <div className="hud-val">
            {lockedTarget ? `LOCKED: ${lockedTarget.title.toUpperCase()}` : 'SCANNING UNIVERSE...'}
          </div>
        </div>
        <div className="scope-hud bottom-right">
          <div className="hud-label">CELESTIAL BEARING</div>
          <div className="hud-val">RA 18h 42m / DEC +41°</div>
        </div>

        {/* Lock Banner Card */}
        {lockedTarget && (
          <div
            className="scope-lock-card visible"
            onClick={(e) => {
              e.stopPropagation();
              openDiscoveryModal(lockedTarget);
            }}
          >
            <div className="lock-icon">✦ DEEP SPACE SECRET DETECTED ✦</div>
            <div className="lock-title">{lockedTarget.title}</div>
            <div className="lock-desc">Tap to unlock hidden celestial memory ➔</div>
          </div>
        )}
      </div>

      {/* Scope Controls */}
      <div className="scope-controls" onClick={e => e.stopPropagation()}>
        <button className="exit-scope-btn" onClick={closeTelescope}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span>Lower Telescope</span>
        </button>
        <div className="scope-hint">Drag screen to scan deep space • Tap secrets to discover memory</div>
      </div>
    </div>
  );
}
