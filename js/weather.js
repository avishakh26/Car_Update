// ============================================================
// WEATHER.JS — Rain & Snow particle systems
// ============================================================

const Weather = (() => {
  const PARTICLE_COUNT = 3000;
  let rainSystem = null;
  let snowSystem = null;
  let currentWeather = 'clear';

  function createRain() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 6); // 2 vertices per line
    const vel = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 120;
      const y = Math.random() * 80;
      const z = (Math.random() - 0.5) * 120;
      const rainLength = 1.5 + Math.random() * 2; // Realistic rain streak length
      pos[i*6]   = x;
      pos[i*6+1] = y;
      pos[i*6+2] = z;
      pos[i*6+3] = x;
      pos[i*6+4] = y - rainLength;
      pos[i*6+5] = z;
      vel[i] = 100 + Math.random() * 50; // Faster falling for realism
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.userData.vel = vel;
    const mat = new THREE.LineBasicMaterial({
      color: 0x88bbcc, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    rainSystem = new THREE.LineSegments(geo, mat);
    rainSystem.visible = false;
    rainSystem.frustumCulled = false;
    scene.add(rainSystem);
  }

  function createSnow() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 2); // x drift, fall speed
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 100;
      pos[i*3+1] = Math.random() * 60;
      pos[i*3+2] = (Math.random() - 0.5) * 100;
      vel[i*2]   = (Math.random() - 0.5) * 0.5;
      vel[i*2+1] = 1.5 + Math.random() * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.userData.vel = vel;
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 2.0, transparent: true, opacity: 0.9,
      sizeAttenuation: false, depthWrite: false
    });
    snowSystem = new THREE.Points(geo, mat);
    snowSystem.visible = false;
    snowSystem.frustumCulled = false;
    scene.add(snowSystem);
  }

  function init() {
    createRain();
    createSnow();
  }

  function setWeather(w) {
    currentWeather = w;
    if (rainSystem) rainSystem.visible = (w === 'rain');
    if (snowSystem) snowSystem.visible = (w === 'snow');
  }

  let lastCarPos = new THREE.Vector3();
  let carVel = new THREE.Vector3();

  function update(dt, carPos) {
    if (!carPos) return;

    if (dt > 0) {
      carVel.subVectors(carPos, lastCarPos).divideScalar(dt);
      if (carVel.length() > 1000) carVel.set(0, 0, 0);
    }
    lastCarPos.copy(carPos);

    // Sync factor: 1.0 means rain moves exactly with the car (0 relative speed)
    // 0.0 means rain is stationary in the world (very fast relative speed)
    // 0.85 gives a nice visible rushing effect without zipping past instantly.
    const syncFactor = 0.85;
    const moveX = carVel.x * syncFactor * dt;
    const moveZ = carVel.z * syncFactor * dt;

    if (currentWeather === 'rain' && rainSystem) {
      const pos = rainSystem.geometry.attributes.position.array;
      const vel = rainSystem.geometry.userData.vel;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i*6]   += moveX;
        pos[i*6+2] += moveZ;
        pos[i*6+1] -= vel[i] * dt;
        
        pos[i*6+3] += moveX;
        pos[i*6+5] += moveZ;
        pos[i*6+4] -= vel[i] * dt;
        
        // Wrap X and Z
        let dx = pos[i*6] - carPos.x;
        let dz = pos[i*6+2] - carPos.z;
        if (dx > 60) {
          pos[i*6] -= 120; pos[i*6+3] -= 120;
        } else if (dx < -60) {
          pos[i*6] += 120; pos[i*6+3] += 120;
        }

        if (dz > 60) {
          pos[i*6+2] -= 120; pos[i*6+5] -= 120;
        } else if (dz < -60) {
          pos[i*6+2] += 120; pos[i*6+5] += 120;
        }

        if (pos[i*6+1] < carPos.y - 2) {
          const shiftY = 60 + Math.random() * 20;
          pos[i*6+1] += shiftY;
          pos[i*6+4] += shiftY;
        }
      }
      rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    if (currentWeather === 'snow' && snowSystem) {
      const pos = snowSystem.geometry.attributes.position.array;
      const vel = snowSystem.geometry.userData.vel;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i*3]   += moveX + vel[i*2] * dt * 5;
        pos[i*3+2] += moveZ;
        pos[i*3+1] -= vel[i*2+1] * dt;
        
        // Wrap X and Z
        let dx = pos[i*3] - carPos.x;
        let dz = pos[i*3+2] - carPos.z;
        if (dx > 50) pos[i*3] -= 100; else if (dx < -50) pos[i*3] += 100;
        if (dz > 50) pos[i*3+2] -= 100; else if (dz < -50) pos[i*3+2] += 100;

        if (pos[i*3+1] < carPos.y - 2) {
          pos[i*3+1] += 50 + Math.random() * 10;
        }
      }
      snowSystem.geometry.attributes.position.needsUpdate = true;
    }
  }

  return { init, setWeather, update };
})();
