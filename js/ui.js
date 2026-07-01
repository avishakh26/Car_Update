// ============================================================
// UI.JS — HUD updates, settings panel, biome switching
// ============================================================

const UI = (() => {
  let settingsOpen = false;

  function init() {
    // Keyboard settings
    document.addEventListener('keydown', e => {
      if (!G.started) return;
      const k = e.key;
      // Disable autodrive on any explicit driving input
      if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S', 'ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(k)) {
        if (G.autodrive) {
          setAutodrive(false);
        }
      }
      if (k === 'ArrowLeft'  || k === 'a' || k === 'A') {
          G.keys.left  = true;
      }
      if (k === 'ArrowRight' || k === 'd' || k === 'D') {
          G.keys.right = true;
      }
      if (k === 'ArrowUp'   || k === 'w' || k === 'W') G.keys.up    = true;
      if (k === 'ArrowDown'  || k === 's' || k === 'S') G.keys.down  = true;
      if (k === 'v' || k === 'V') toggleCameraMode();
      if (k === 'Escape') closeSettings();
    });
    document.addEventListener('keyup', e => {
      const k = e.key;
      if (k === 'ArrowLeft'  || k === 'a' || k === 'A') G.keys.left  = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D') G.keys.right = false;
      if (k === 'ArrowUp'   || k === 'w' || k === 'W') G.keys.up    = false;
      if (k === 'ArrowDown'  || k === 's' || k === 'S') G.keys.down  = false;
    });

    // Mobile controls setup
    bindBtn('mLeft', 'left');
    bindBtn('mRight', 'right');
    bindBtn('mGas', 'up');
    bindBtn('mBrake', 'down');
  }

  function bindBtn(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const press = (e) => {
      e.preventDefault();
      if (G.autodrive) setAutodrive(false);
      G.keys[key] = true;
    };
    const release = (e) => {
      e.preventDefault();
      G.keys[key] = false;
    };

    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
    el.addEventListener('mouseleave', release);
  }

  function closeSettings() {
    settingsOpen = false;
    document.getElementById('settingsPanel').classList.remove('open');
  }

  function update() {
    const kmh = Math.round(G.carSpeed * 3.0);
    document.getElementById('speedVal').textContent = kmh;
    // Distance: show one decimal km
    const km = (G.distance / 1000).toFixed(1);
    document.getElementById('distVal').textContent = km;
    // Lock icon: visible when at speed limit (autodrive)
    const lockEl = document.getElementById('speedLockIcon');
    if (lockEl) lockEl.style.opacity = G.autodrive ? '0.5' : '0';
  }

  return { init, update };
})();

// Global functions for one-liner HTML onClick calls
function startDrive() {
  document.getElementById('splash').classList.add('hidden');
  setTimeout(() => { document.getElementById('splash').style.display = 'none'; }, 950);
  document.getElementById('hud').style.display = 'block';
  G.started = true;
  setAutodrive(true); // Auto-start driving so it doesn't just stop
  G.carSpeed = G.maxSpeed * 0.5; // Start at half speed
  Audio.startPlayback(); // Auto-play default music on journey start
}

function toggleSettings(forceOpen) {
  const p = document.getElementById('settingsPanel');
  if (forceOpen === true) { p.classList.add('open'); }
  else { p.classList.toggle('open'); }
}

function setBiome(biome) {
  G.biome = biome;
  document.querySelectorAll('.biome-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('biome-' + biome).classList.add('active');
  Road.applyBiome();
  Environment.applyBiome();
  updateSky(G.timeOfDay, G.biome);
}

function setTimeOfDay(v) {
  G.timeOfDay = parseFloat(v);
  updateSky(G.timeOfDay, G.biome);
}

function setWeather(w) {
  G.weather = w;
  Weather.setWeather(w);
}

function setFog(v) {
  G.fogFar = parseFloat(v);
  if (scene.fog) { scene.fog.near = G.fogNear; scene.fog.far = G.fogFar; }
}

function setAutodrive(v) {
  G.autodrive = v;
  const btn = document.getElementById('autodriveBtn');
  if (btn) btn.classList.toggle('on', v);
}

function setSpeedLimit(v) {
  G.maxSpeed = parseFloat(v) / 3.0;
}

function toggleCameraMode() {
  // Ignored FPP mode
}

// Spawn twinkle stars on splash
(function spawnStars() {
  const cont = document.getElementById('splashStars');
  if (!cont) return;
  for (let i = 0; i < 100; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left  = Math.random() * 100 + '%';
    s.style.top   = Math.random() * 100 + '%';
    s.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
    s.style.setProperty('--delay', (Math.random() * 4) + 's');
    cont.appendChild(s);
  }
})();
