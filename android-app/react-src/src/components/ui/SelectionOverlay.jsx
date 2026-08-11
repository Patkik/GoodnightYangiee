import React from 'react';
import { useAppStore } from '../../store/appStore.js';

export default function SelectionOverlay() {
  const onboardingPhase = useAppStore(s => s.onboardingPhase);
  const hoveredPersona = useAppStore(s => s.hoveredPersona);
  const setHoveredPersona = useAppStore(s => s.setHoveredPersona);
  const setPersona = useAppStore(s => s.setPersona);
  const setOnboardingPhase = useAppStore(s => s.setOnboardingPhase);

  if (onboardingPhase !== 5) {
    return (
      <div className="onboarding-skip-banner" style={{ display: onboardingPhase ? 'flex' : 'none' }}>
        <div className="phase-pill">
          {onboardingPhase === 1 && '✦ PHASE 1 · COSMIC PLAY'}
          {onboardingPhase === 2 && '✦ PHASE 2 · ATMOSPHERIC DESCENT'}
          {(onboardingPhase === 3 || onboardingPhase === 4) && '✦ PHASE 3 & 4 · PLANET LANDING'}
        </div>
        <button
          className="skip-intro-btn"
          onClick={() => setOnboardingPhase(5)}
        >
          Skip Intro ➔
        </button>
      </div>
    );
  }

  return (
    <div className="selection-stage-overlay">
      <div className="selection-header">
        <div className="selection-subtitle">CELESTIAL SANCTUARY IDENTITIES</div>
        <h1 className="selection-prompt">Are you Pat or Yang?</h1>
        <div className="selection-hint">Select your persona to enter your sanctuary</div>
      </div>

      <div className="photo-frames-container">
        {/* PAT PHOTO FRAME */}
        <div
          className={`persona-photo-item pat-photo-item ${hoveredPersona === 'pat' ? 'focused' : hoveredPersona === 'yang' ? 'softened' : ''}`}
          onMouseEnter={() => setHoveredPersona('pat')}
          onMouseLeave={() => setHoveredPersona(null)}
          onTouchStart={() => setHoveredPersona('pat')}
          onClick={() => setPersona('pat')}
        >
          <div className="photo-frame pat-frame">
            <img src="pat_photo.jpg" alt="Pat Persona" className="persona-img" />
            <div className="frame-glow-ring pat-glow"></div>
            <div className="frame-corner-accents">
              <span className="corner top-left"></span>
              <span className="corner top-right"></span>
              <span className="corner bottom-left"></span>
              <span className="corner bottom-right"></span>
            </div>
          </div>

          <button className="select-persona-btn pat-btn">
            SELECT PAT ➔
          </button>
        </div>

        {/* YANG PHOTO FRAME */}
        <div
          className={`persona-photo-item yang-photo-item ${hoveredPersona === 'yang' ? 'focused' : hoveredPersona === 'pat' ? 'softened' : ''}`}
          onMouseEnter={() => setHoveredPersona('yang')}
          onMouseLeave={() => setHoveredPersona(null)}
          onTouchStart={() => setHoveredPersona('yang')}
          onClick={() => setPersona('yang')}
        >
          <div className="photo-frame yang-frame">
            <img src="yang_photo.jpg" alt="Yang Persona" className="persona-img" />
            <div className="frame-glow-ring yang-glow"></div>
            <div className="frame-corner-accents">
              <span className="corner top-left"></span>
              <span className="corner top-right"></span>
              <span className="corner bottom-left"></span>
              <span className="corner bottom-right"></span>
            </div>
          </div>

          <button className="select-persona-btn yang-btn">
            SELECT YANG ➔
          </button>
        </div>
      </div>

      <div className="selection-footer-note">
        ✦ Selection can be switched anytime from your sanctuary header avatar
      </div>
    </div>
  );
}
