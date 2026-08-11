import React from 'react';
import { useAppStore } from '../../store/appStore.js';
import SkyCharacterStage3D from '../sanctuary/SkyCharacterStage3D.jsx';

export default function SelectionOverlay() {
  const onboardingPhase = useAppStore(s => s.onboardingPhase);
  const hoveredPersona = useAppStore(s => s.hoveredPersona);
  const setHoveredPersona = useAppStore(s => s.setHoveredPersona);
  const setPersona = useAppStore(s => s.setPersona);
  const setOnboardingPhase = useAppStore(s => s.setOnboardingPhase);

  if (onboardingPhase !== 5) {
    return (
      <div className="intro-phase-subtitle-container" style={{ display: onboardingPhase ? 'flex' : 'none' }}>
        <div className="intro-phase-subtitle">
          {onboardingPhase === 1 && '✦ Phase 1 · Cosmic Play'}
          {onboardingPhase === 2 && '✦ Phase 2 · Atmospheric Descent'}
          {(onboardingPhase === 3 || onboardingPhase === 4) && '✦ Phase 3 · Planet Landing'}
        </div>
        <button
          className="intro-skip-link"
          onClick={() => setOnboardingPhase(5)}
        >
          Skip Intro ➔
        </button>
      </div>
    );
  }

  return (
    <>
      <SkyCharacterStage3D />
      <div className="selection-stage-overlay">
        <div className="selection-header">
          <div className="selection-subtitle">SKY-STYLE CELESTIAL STAGE</div>
          <h1 className="selection-prompt">Are you Pat or Yang?</h1>
          <div className="selection-hint">Choose your identity to anchor your sanctuary experience</div>
        </div>

        <div className="sky-selection-buttons-container">
          {/* PAT SELECTION ITEM */}
          <div
            className={`sky-select-item pat-sky-item ${hoveredPersona === 'pat' ? 'focused' : hoveredPersona === 'yang' ? 'softened' : ''}`}
            onMouseEnter={() => setHoveredPersona('pat')}
            onMouseLeave={() => setHoveredPersona(null)}
            onTouchStart={() => setHoveredPersona('pat')}
            onClick={() => setPersona('pat')}
          >
            <div className="sky-hero-title pat-title">Pat</div>
            <div className="sky-hero-role">The Anchor · Structure</div>
            <button className="select-persona-btn pat-btn">
              SELECT PAT ➔
            </button>
          </div>

          {/* YANG SELECTION ITEM */}
          <div
            className={`sky-select-item yang-sky-item ${hoveredPersona === 'yang' ? 'focused' : hoveredPersona === 'pat' ? 'softened' : ''}`}
            onMouseEnter={() => setHoveredPersona('yang')}
            onMouseLeave={() => setHoveredPersona(null)}
            onTouchStart={() => setHoveredPersona('yang')}
            onClick={() => setPersona('yang')}
          >
            <div className="sky-hero-title yang-title">Yang</div>
            <div className="sky-hero-role">The Catalyst · Flow</div>
            <button className="select-persona-btn yang-btn">
              SELECT YANG ➔
            </button>
          </div>
        </div>

        <div className="selection-footer-note">
          ✦ Selection can be switched anytime from your sanctuary header avatar
        </div>
      </div>
    </>
  );
}
