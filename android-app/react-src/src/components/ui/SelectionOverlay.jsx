import React from 'react';
import { useAppStore } from '../../store/appStore.js';
import CharacterAvatar3D from './CharacterAvatar3D.jsx';

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
        <div className="selection-subtitle">GENSHIN-STYLE IDLE SELECTION</div>
        <h1 className="selection-prompt">Are you Pat or Yang?</h1>
        <div className="selection-hint">Choose your identity to anchor your sanctuary experience</div>
      </div>

      <div className="character-cards-container">
        {/* PAT CARD */}
        <div
          className={`character-select-card pat-card ${hoveredPersona === 'pat' ? 'focused' : hoveredPersona === 'yang' ? 'softened' : ''}`}
          onMouseEnter={() => setHoveredPersona('pat')}
          onMouseLeave={() => setHoveredPersona(null)}
          onTouchStart={() => setHoveredPersona('pat')}
          onClick={() => setPersona('pat')}
        >
          <div className="card-badge pat-badge">THE ANCHOR</div>
          <div className="char-avatar-ring pat-ring">
            <CharacterAvatar3D persona="pat" isFocused={hoveredPersona === 'pat'} />
          </div>
          <h2 className="char-name pat-name">Pat</h2>
          <div className="char-role">Structure · Steadiness · Clarity</div>
          
          <ul className="char-specs">
            <li><span className="spec-label">Complexion:</span> Warm, rich brown skin</li>
            <li><span className="spec-label">Hair:</span> Classic textured fringe</li>
            <li><span className="spec-label">Palette:</span> Terracotta, Amber Gold, Indigo</li>
            <li><span className="spec-label">Energy:</span> Grounded & Intuitive Guide</li>
          </ul>

          <button className="select-char-btn pat-btn">
            SELECT PAT ➔
          </button>
        </div>

        {/* YANG CARD */}
        <div
          className={`character-select-card yang-card ${hoveredPersona === 'yang' ? 'focused' : hoveredPersona === 'pat' ? 'softened' : ''}`}
          onMouseEnter={() => setHoveredPersona('yang')}
          onMouseLeave={() => setHoveredPersona(null)}
          onTouchStart={() => setHoveredPersona('yang')}
          onClick={() => setPersona('yang')}
        >
          <div className="card-badge yang-badge">THE CATALYST</div>
          <div className="char-avatar-ring yang-ring">
            <CharacterAvatar3D persona="yang" isFocused={hoveredPersona === 'yang'} />
          </div>
          <h2 className="char-name yang-name">Yang</h2>
          <div className="char-role">Flow · Creative Spark · Agility</div>

          <ul className="char-specs">
            <li><span className="spec-label">Complexion:</span> Pale porcelain skin</li>
            <li><span className="spec-label">Hair:</span> Bleached copper-orange w/ dark roots</li>
            <li><span className="spec-label">Markings:</span> Glowing bioluminescent arm tattoos</li>
            <li><span className="spec-label">Energy:</span> Dynamic & Edge-Chic Traveler</li>
          </ul>

          <button className="select-char-btn yang-btn">
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
