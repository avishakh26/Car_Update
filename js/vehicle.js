// ============================================================
// VEHICLE.JS — Realistic car mesh with PBR materials
// ============================================================

const Vehicle = (() => {
  const root = new THREE.Group();
  scene.add(root);

  // --- PBR Materials ---
  // Car paint: deep navy with slight metallic sheen
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a5c,
    roughness: 0.18,
    metalness: 0.85,
    envMapIntensity: 1.0,
  });

  // Glass: tinted dark
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2a35,
    roughness: 0.02,
    metalness: 0.05,
    transparent: true,
    opacity: 0.72,
  });

  // Rubber tire
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0d,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Chrome rim
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    roughness: 0.05,
    metalness: 1.0,
  });

  // Headlight lens
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0xffffee,
    emissiveIntensity: 0.0,
    transparent: true,
    opacity: 0.9,
  });

  // Taillight lens
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1a00,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xff0000,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.88,
  });

  // Black plastic trim
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.7,
    metalness: 0.0,
  });

  // Chrome accent
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xbbbbbb,
    roughness: 0.1,
    metalness: 1.0,
  });

  // Underbody / dark panels
  const underbodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.9,
    metalness: 0.1,
  });

  // ----------------------------------------------------------------
  // BODY — realistic sedan proportions
  // ----------------------------------------------------------------

  // Main lower body (wider, flatter)
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.62, 4.4), bodyMat);
  lowerBody.position.y = 0.52;
  lowerBody.castShadow = true;
  root.add(lowerBody);

  // Shoulder crease (thin raised strip along side)
  [-1.01, 1.01].forEach(x => {
    const crease = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 3.8), chromeMat);
    crease.position.set(x, 0.72, 0);
    root.add(crease);
  });

  // Upper cabin — tapered trapezoid via scaled box
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.58, 2.4), bodyMat);
  cabin.position.set(0, 1.11, -0.15);
  cabin.castShadow = true;
  root.add(cabin);

  // A-pillar reinforcement (angled roof edge, front)
  const aPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), bodyMat);
  aPillarL.position.set(-0.82, 1.05, 0.98);
  aPillarL.rotation.x = -0.38;
  root.add(aPillarL);
  const aPillarR = aPillarL.clone();
  aPillarR.position.set(0.82, 1.05, 0.98);
  root.add(aPillarR);

  // Roof panel (slightly narrower)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.06, 2.1), bodyMat);
  roof.position.set(0, 1.42, -0.15);
  root.add(roof);

  // Windshield (angled glass panel)
  const wind = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.56, 0.06), glassMat);
  wind.position.set(0, 1.12, 1.03);
  wind.rotation.x = 0.42;
  wind.castShadow = false;
  root.add(wind);

  // Rear window
  const rear = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.50, 0.06), glassMat);
  rear.position.set(0, 1.10, -1.3);
  rear.rotation.x = -0.38;
  root.add(rear);

  // Side windows (L and R)
  [-0.855, 0.855].forEach(x => {
    // Front side window
    const fw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.38, 0.75), glassMat);
    fw.position.set(x, 1.14, 0.46);
    root.add(fw);
    // Rear side window
    const rw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.68), glassMat);
    rw.position.set(x, 1.12, -0.52);
    root.add(rw);
    // B-pillar (between windows)
    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.38, 0.12), bodyMat);
    bp.position.set(x, 1.13, 0.07);
    root.add(bp);
  });

  // Door panels (subtle indents, same material)
  [-1.02, 1.02].forEach(x => {
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.44, 1.8), bodyMat);
    dp.position.set(x, 0.62, 0.02);
    root.add(dp);
  });

  // Door handles
  [-1.06, 1.06].forEach(x => {
    // Front door handle
    const dh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.055, 0.24), chromeMat);
    dh.position.set(x, 0.72, 0.52);
    root.add(dh);
    // Rear door handle
    const drh = dh.clone();
    drh.position.set(x, 0.72, -0.42);
    root.add(drh);
  });

  // Hood (forward-sloping)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 1.45), bodyMat);
  hood.position.set(0, 0.88, 1.42);
  hood.rotation.x = -0.15;
  hood.castShadow = true;
  root.add(hood);

  // Hood crease (center ridge)
  const hoodRidge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.3), bodyMat);
  hoodRidge.position.set(0, 0.93, 1.42);
  hoodRidge.rotation.x = -0.15;
  root.add(hoodRidge);

  // Trunk lid
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.07, 0.9), bodyMat);
  trunk.position.set(0, 0.87, -1.88);
  trunk.rotation.x = 0.08;
  root.add(trunk);

  // Front bumper (multi-part)
  const fBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.32, 0.18), trimMat);
  fBumper.position.set(0, 0.38, 2.27);
  root.add(fBumper);

  // Front grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.06), trimMat);
  grille.position.set(0, 0.55, 2.26);
  root.add(grille);

  // Grille chrome surround
  const grilleSurround = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.30, 0.04), chromeMat);
  grilleSurround.position.set(0, 0.55, 2.27);
  root.add(grilleSurround);

  // Lower front air intake
  const intake = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.08), trimMat);
  intake.position.set(0, 0.24, 2.26);
  root.add(intake);

  // Front lower chrome strip
  const fStrip = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.035, 0.05), chromeMat);
  fStrip.position.set(0, 0.55, 2.28);
  root.add(fStrip);

  // Rear bumper
  const rBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.28, 0.16), trimMat);
  rBumper.position.set(0, 0.38, -2.28);
  root.add(rBumper);

  // Rear diffuser
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.06), underbodyMat);
  diffuser.position.set(0, 0.22, -2.28);
  root.add(diffuser);

  // Exhaust pipes (twin)
  [-0.38, 0.38].forEach(x => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.2, 10), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, 0.22, -2.33);
    root.add(pipe);
  });

  // --- HEADLIGHTS (realistic multi-element) ---
  [-0.68, 0.68].forEach(x => {
    // Main housing
    const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.06), trimMat);
    hlHousing.position.set(x, 0.64, 2.26);
    root.add(hlHousing);
    // DRL strip (daytime running light)
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.04), headlightMat);
    drl.position.set(x, 0.68, 2.26);
    root.add(drl);
    // Main beam lens
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.04), headlightMat);
    lens.position.set(x, 0.60, 2.26);
    root.add(lens);
  });

  // --- TAILLIGHTS (wrap-around style) ---
  [-0.65, 0.65].forEach(x => {
    const tlMain = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.04), taillightMat);
    tlMain.position.set(x, 0.66, -2.27);
    root.add(tlMain);
    // Side wrap
    const tlSide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.18), taillightMat);
    tlSide.position.set(x * 1.02, 0.66, -2.2);
    root.add(tlSide);
    // Reflector
    const refl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.03), chromeMat);
    refl.position.set(x * 0.4, 0.28, -2.28);
    root.add(refl);
  });

  // Center brake light (high mount)
  const stopLight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.04), taillightMat);
  stopLight.position.set(0, 1.42, -1.22);
  root.add(stopLight);

  // Rear chrome strip
  const rStrip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.04), chromeMat);
  rStrip.position.set(0, 0.72, -2.27);
  root.add(rStrip);

  // Trunk badge (small emblem)
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.03), chromeMat);
  badge.position.set(0, 0.94, -2.27);
  root.add(badge);

  // Side mirrors
  [-1.0, 1.0].forEach(x => {
    const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.24), bodyMat);
    mirrorArm.position.set(x * 1.07, 1.08, 0.88);
    root.add(mirrorArm);
    const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.18), bodyMat);
    mirrorHead.position.set(x * 1.11, 1.1, 0.78);
    root.add(mirrorHead);
    // Mirror glass
    const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.10, 0.14), glassMat);
    mirrorGlass.position.set(x * 1.12, 1.1, 0.78);
    root.add(mirrorGlass);
  });

  // Underbody panel
  const underbody = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 3.8), underbodyMat);
  underbody.position.set(0, 0.18, 0);
  root.add(underbody);

  // --- WHEELS — realistic rubber + 5-spoke alloy rim ---
  const tireGeo = new THREE.CylinderGeometry(0.40, 0.40, 0.30, 32);
  const innerRimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 32);
  const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.34, 16);

  // Spoke geometry (5 spokes, each a flat box)
  function buildWheel(posX, posY, posZ) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(posX, posY, posZ);

    // Tire
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim face (disc)
    const rimFace = new THREE.Mesh(innerRimGeo, rimMat);
    rimFace.rotation.z = Math.PI / 2;
    wheelGroup.add(rimFace);

    // 5 spokes
    for (let s = 0; s < 5; s++) {
      const spokeGeo = new THREE.BoxGeometry(0.055, 0.34, 0.14);
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.rotation.z = (s / 5) * Math.PI * 2;
      spoke.position.set(Math.sin((s / 5) * Math.PI * 2) * 0.15, 0, 0);
      spoke.rotation.x = Math.PI / 2;
      // Lay flat along the axle
      const spokeWrapper = new THREE.Group();
      spokeWrapper.rotation.x = Math.PI / 2;
      const innerSpoke = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.055, 0.10), rimMat);
      innerSpoke.position.set(0.12, 0, 0);
      innerSpoke.rotation.z = (s / 5) * Math.PI * 2;
      spokeWrapper.add(innerSpoke);
      wheelGroup.add(spokeWrapper);
    }

    // Hub center
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    hub.rotation.z = Math.PI / 2;
    wheelGroup.add(hub);

    // Hub cap bolt pattern (6 small cylinders)
    for (let b2 = 0; b2 < 6; b2++) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6), chromeMat);
      bolt.rotation.z = Math.PI / 2;
      bolt.position.set(0, Math.sin((b2 / 6) * Math.PI * 2) * 0.045, Math.cos((b2 / 6) * Math.PI * 2) * 0.045);
      wheelGroup.add(bolt);
    }

    // Brake disc (visible through spokes)
    const brakeDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 24), new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.8 }));
    brakeDisc.rotation.z = Math.PI / 2;
    wheelGroup.add(brakeDisc);

    root.add(wheelGroup);
    return wheelGroup;
  }

  const wheelPositions = [
    [-1.04, 0.40,  1.42],  // FL
    [ 1.04, 0.40,  1.42],  // FR
    [-1.04, 0.40, -1.42],  // RL
    [ 1.04, 0.40, -1.42],  // RR
  ];

  const wheels = wheelPositions.map(p => buildWheel(p[0], p[1], p[2]));

  // --- Headlight SpotLights ---
  const headlightL = new THREE.SpotLight(0xfff5e0, 0, 80, Math.PI * 0.14, 0.35, 1.2);
  headlightL.position.set(-0.68, 0.64, 2.2);
  headlightL.target.position.set(-3, -1.5, -40);
  root.add(headlightL); root.add(headlightL.target);

  const headlightR = new THREE.SpotLight(0xfff5e0, 0, 80, Math.PI * 0.14, 0.35, 1.2);
  headlightR.position.set(0.68, 0.64, 2.2);
  headlightR.target.position.set(3, -1.5, -40);
  root.add(headlightR); root.add(headlightR.target);

  // Physics state
  let steerAngle = 0;
  let spinAngle = 0;

  function update(dt) {
    const keys = G.keys;
    const maxSpd = G.maxSpeed;

    // --- Speed ---
    if (keys.up && !G.autodrive) {
      G.carSpeed = Math.min(G.carSpeed + G.acceleration * dt, maxSpd);
    } else if (keys.down) {
      G.carSpeed = Math.max(G.carSpeed - G.braking * dt, 0);
    } else {
      G.carSpeed = Math.max(G.carSpeed - 8 * dt, G.autodrive ? G.maxSpeed * 0.75 : 0);
    }

    if (G.autodrive) {
      G.carSpeed = Math.min(G.carSpeed + G.acceleration * dt, G.maxSpeed * 0.75);
    }

    // --- Steering ---
    let steerInput = 0;
    if (keys.left)  steerInput = -1;
    if (keys.right) steerInput =  1;
    if (G.autodrive) steerInput = -Math.sign(G.lateralOffset) * Math.min(Math.abs(G.lateralOffset) * 0.15, 1);

    const steerMax = 3.5;
    const speedFactor = Math.max(0.3, 1 - G.carSpeed / maxSpd * 0.6);
    G.lateralVel += steerInput * G.steerForce * speedFactor * dt;
    G.lateralVel *= Math.pow(G.steerFriction, dt * 60);
    G.lateralOffset += G.lateralVel * dt;
    G.lateralOffset = Math.max(-steerMax, Math.min(steerMax, G.lateralOffset));

    steerAngle += (steerInput * 0.35 - steerAngle) * 0.25;

    // --- Wheel spin ---
    spinAngle += (G.carSpeed / 0.40) * dt;
    wheels.forEach((wg, i) => {
      // Spin the whole group on local X axis (mounted along Z)
      wg.rotation.x = spinAngle;
    });

    // Body roll
    root.rotation.z = -G.lateralVel * 0.028;

    // Headlight emissive when in motion
    const isNight = G.timeOfDay < 0.2 || G.timeOfDay > 0.8;
    const hlInt = isNight ? 3.5 : 0;
    headlightL.intensity = hlInt;
    headlightR.intensity = hlInt;
    headlightMat.emissiveIntensity = isNight ? 2.5 : 0.0;

    // Brake lights brighten when slowing
    const braking = keys.down;
    taillightMat.emissiveIntensity = braking ? 1.8 : (isNight ? 0.6 : 0.2);
  }

  function setPosition(pos, quat) {
    root.position.copy(pos);
    root.quaternion.copy(quat);
  }

  function getRoot() { return root; }
  function setColor(hex) { bodyMat.color.setHex(hex); }

  return { update, setPosition, getRoot, setColor };
})();
