// ============================================================
// TRAFFIC.JS — A few NPC cars driving on the road
// ============================================================

const Traffic = (() => {
  const NPC_COUNT = 5; // total NPC cars
  const NPC_COLORS = [0xdd2020, 0x2060cc, 0xe0a020, 0xffffff, 0x20aa44];

  // Each NPC: { group, bodyMesh, t, speed, lateralOffset }
  let npcs = [];

  // Build a simple low-poly car mesh (box body + extruded cab + wheels)
  function _buildCarMesh(color) {
    const group = new THREE.Group();

    // Body —wide box
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.65, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabGeo = new THREE.BoxGeometry(1.6, 0.55, 2.0);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.2, metalness: 0.5 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, 1.05, -0.3);
    cab.castShadow = true;
    group.add(cab);

    // Wheels (4 cylinders)
    const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    const wheelPos = [
      [-1.1, 0.35,  1.3],
      [ 1.1, 0.35,  1.3],
      [-1.1, 0.35, -1.3],
      [ 1.1, 0.35, -1.3],
    ];
    wheelPos.forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, wy, wz);
      group.add(w);
    });

    // Tail lights (two small red emissive boxes)
    const tlGeo = new THREE.BoxGeometry(0.35, 0.15, 0.05);
    const tlMat = new THREE.MeshStandardMaterial({ color: 0xff1111, emissive: 0xdd0000, emissiveIntensity: 1.2 });
    [-0.65, 0.65].forEach(lx => {
      const tl = new THREE.Mesh(tlGeo, tlMat);
      tl.position.set(lx, 0.6, 2.23);
      group.add(tl);
    });

    // Headlights (two small yellow boxes)
    const hlGeo = new THREE.BoxGeometry(0.3, 0.12, 0.05);
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffee88, emissiveIntensity: 0.8 });
    [-0.6, 0.6].forEach(lx => {
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(lx, 0.6, -2.23);
      group.add(hl);
    });

    return group;
  }

  function init() {
    // Clean up old
    npcs.forEach(n => scene.remove(n.group));
    npcs = [];

    // Spawn NPC cars spread ahead of player along the road
    for (let i = 0; i < NPC_COUNT; i++) {
      // Spread between t=0.08 and t=0.38 (ahead of player start)
      const t = 0.10 + (i / NPC_COUNT) * 0.28;
      const speed = 20 + Math.random() * 20; // units/sec (slower than player max)
      const laneOff = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 1.5); // slight lane offset
      const color = NPC_COLORS[i % NPC_COLORS.length];
      const group = _buildCarMesh(color);
      scene.add(group);
      npcs.push({ group, t, speed, lateralOffset: laneOff });
    }
  }

  function update(dt) {
    if (!G.started) return;

    const len = Road._curveLength || 3000;
    npcs.forEach(npc => {
      // Advance NPC along road
      const tPerSec = npc.speed / (Road._curveLen || 3000);
      npc.t += tPerSec * dt;

      // If NPC has gone past the road rebuild zone, reset it ahead of player
      if (npc.t > 0.42 || npc.t < G.roadT) {
        npc.t = G.roadT + 0.12 + Math.random() * 0.20;
        if (npc.t > 0.42) npc.t = G.roadT + 0.12;
      }

      // Get world position from road curve
      try {
        const pt = Road._getPointAt(npc.t, npc.lateralOffset);
        if (!pt) return;
        const { pos, quat } = pt;

        pos.y += 0.38; // sit on road
        npc.group.position.copy(pos);
        npc.group.quaternion.copy(quat);

          // Dodge logic for autodrive - Overtake slow cars!
          if (G.autodrive && G.crashed <= 0) {
            // Check if NPC is ahead of player and in similar lane
            const distAhead = npc.t - G.roadT;
            if (distAhead > 0 && distAhead < 0.05) { // Roughly visible and close
              if (Math.abs(G.lateralOffset - npc.lateralOffset) < 2.0) { // Same lane
                // Shift target offset to an open lane
                G.targetOffset = npc.lateralOffset > 0 ? -3.5 : 3.5;
                // Give car power to overtake
                G.carSpeed = Math.min(G.carSpeed + 10, G.maxSpeed * 1.2); 
              }
            }
          }

          // --- Collision Detection ---
          if (G.crashed <= 0 && pos.distanceToSquared(Vehicle.getRoot().position) < 14.5) { // increased from 12.0
             G.crashed = 0.8; // Reduced crash stun time so you don't get completely stuck
             G.carSpeed = Math.max(0, G.carSpeed - 15); // Less penalty for smoother overtaking
