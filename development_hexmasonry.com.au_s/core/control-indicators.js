export function initControlIndicators() {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #control-indicators {
      position: absolute;
      bottom: 5%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 12px;
      padding: 1rem 2rem;
      font-family: sans-serif;
      color: #333;
      pointer-events: none;
      transition: opacity 1s ease;
      max-width: 90vw;
    }

    #control-indicators.fade-out {
      opacity: 0;
    }

    .instruction {
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .row {
      display: flex;
      justify-content: center;
      gap: 2rem;
      align-items: center;
    }

    .arrow {
      font-size: 1.8rem;
      animation: pulse 1.5s infinite;
    }

    .mouse {
      width: 24px;
      height: 32px;
      border: 2px solid #666;
      border-radius: 8px;
      position: relative;
    }
    .mouse::before {
      content: '';
      position: absolute;
      top: 6px;
      left: 8px;
      width: 4px;
      height: 4px;
      background: #666;
      border-radius: 50%;
    }

    .label {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .gestures {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .gesture-icon {
      font-size: 1.5rem;
    }

    .gesture-text {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
    }
  `;
  document.head.appendChild(style);

  // Inject HTML
  const container = document.createElement('div');
  container.id = 'control-indicators';
  container.innerHTML = `
    <div class="instruction desktop">
      <div class="row center"><span class="arrow">↑</span></div>
      <div class="row spaced">
        <span class="arrow">←</span>
        <div class="mouse"></div>
        <span class="arrow">→</span>
      </div>
      <div class="row center"><span class="arrow">↓</span></div>
      <p class="label">Rotate: Left-click & drag</p>
      <p class="label">Pan: Right-click & drag</p>
      <p class="label">Zoom: Scroll or Double-click</p>
    </div>

    <div class="instruction touch">
      <div class="gestures">
        <div class="gesture-icon">🖐️</div>
        <div class="gesture-text">Drag to rotate</div>
      </div>
      <div class="gestures">
        <div class="gesture-icon">👆👆</div>
        <div class="gesture-text">Double tap to zoom</div>
      </div>
      <div class="gestures">
        <div class="gesture-icon">🤏</div>
        <div class="gesture-text">Pinch to zoom</div>
      </div>
      <div class="gestures">
        <div class="gesture-icon">🖐️🖐️</div>
        <div class="gesture-text">Two-finger drag to pan</div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Show correct instructions
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  container.querySelector('.instruction.desktop').style.display = isTouch ? 'none' : 'flex';
  container.querySelector('.instruction.touch').style.display = isTouch ? 'flex' : 'none';

  // Fade out on interaction
  const dismiss = () => {
    container.classList.add('fade-out');
    setTimeout(() => container.remove(), 1000);
    window.removeEventListener('click', dismiss);
    window.removeEventListener('touchstart', dismiss);
  };

  window.addEventListener('click', dismiss);
  window.addEventListener('touchstart', dismiss);
}
