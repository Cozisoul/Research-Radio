// TMM-OS: PERIPHERAL MODULE (DEFINITIVE V1.6 - SELF-RENDERING)
// FILE: /src/js/SignalPlayer.js

export function SignalPlayer(config) {
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.warn("SignalPlayer container not found.");
    return { load: () => {} };
  }

  // 1. Render its own UI into the container
  container.innerHTML = `
    <button id="player-toggle-btn" aria-label="Play/Pause">▶</button>
    <div class="track-info">
      <span id="track-title" class="meta"></span>
      <span id="track-time" class="meta"></span>
    </div>
  `;

  // 2. Now that the UI is rendered, safely select the elements
  const audio = new Audio();
  const toggleBtn = document.getElementById('player-toggle-btn');
  const titleEl = document.getElementById('track-title');
  const timeEl = document.getElementById('track-time');
  let isPlaying = false;

  function formatTime(seconds) { /* ... function remains the same ... */ }
  function updateUI() { /* ... function remains the same ... */ }

  function togglePlay() {
    if (!audio.src) return;
    isPlaying ? audio.pause() : audio.play();
    isPlaying = !isPlaying;
    updateUI();
  }

  function load(track) {
    audio.src = track.url;
    titleEl.textContent = track.title;
    audio.addEventListener('loadedmetadata', updateUI);
    audio.addEventListener('timeupdate', updateUI);
    audio.addEventListener('ended', () => { isPlaying = false; updateUI(); });
  }

  toggleBtn.addEventListener('click', togglePlay);

  return { load };
}