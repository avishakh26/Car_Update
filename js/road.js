// ============================================================
// ROAD.JS — Procedural infinite spline road + terrain
// ============================================================

const Road = (() => {
  const SEG_LEN = 50;   // units between control points
  const ROAD_W = 10;   // road width
  const N_POINTS = 80;   // control points to maintain
  const REBUILD_T = 0.45; // rebuild when car reaches this t

  let pts = [];           // THREE.Vector3 control points
  let curve = null;
  let roadMesh = null, lineMesh = null, barrierMesh = null, streetlightMesh = null;
  let terrainL = null, terrainR = null;
  let lightPositions = []; // Stores {x, y, z} for streetlights

  // Road generation drift state
  let driftAngle = 0, driftOmega = 0;
  let _ptCounter = 0; // track points for sharp turn injection

  function nextPoint(prev) {
    _ptCounter++;
    // Every ~20 points inject a sharp turn event (turning point)
    if (_ptCounter % 20 === 0) {
      driftOmega += (Math.random() > 0.5 ? 1 : -1) * (0.10 + Math.random() * 0.10);
    } else {
      driftOmega += (Math.random() - 0.5) * 0.09;
    }
    driftOmega *= 0.88;
    driftOmega = Math.max(-0.22, Math.min(0.22, driftOmega));
    driftAngle += driftOmega;
    const dx = Math.sin(driftAngle) * SEG_LEN;
    const dz = -Math.cos(driftAngle) * SEG_LEN;
    const nx = (prev.x + dx) * 0.018, nz = (prev.z + dz) * 0.018;
    const hy = Noise.fbm(nx, nz, 3) * 10;
    return new THREE.Vector3(prev.x + dx, hy, prev.z + dz);
  }

  function init() {
    pts = [new THREE.Vector3(0, 0, 0)];
    for (let i = 1; i < N_POINTS; i++) pts.push(nextPoint(pts[i - 1]));
    buildAll();
  }

  function buildCurve() {
    curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  }

  function buildRoad() {
    if (roadMesh) { scene.remove(roadMesh); roadMesh.geometry.dispose(); }
    if (lineMesh) { scene.remove(lineMesh); lineMesh.geometry.dispose(); }
    if (barrierMesh) { scene.remove(barrierMesh); barrierMesh.geometry.dispose(); }

    const samples = curve.getPoints(2000);
    const up = new THREE.Vector3(0, 1, 0);
    const verts = [], idx = [], uvs = [];
    const lVerts = [], lIdx = [];
    const bVerts = [], bIdx = []; // Barrier guardrails
    const slVerts = [], slIdx = []; // Streetlight poles
    lightPositions = [];

    for (let i = 0; i < samples.length - 1; i++) {
      const p0 = samples[i], p1 = samples[i + 1];
      const dir = new THREE.Vector3().subVectors(p1, p0).normalize();
      const right = new THREE.Vector3().crossVectors(dir, up).normalize();
      const hw = ROAD_W / 2;

      const L = p0.clone().addScaledVector(right, -hw); L.y += 0.05;
      const R = p0.clone().addScaledVector(right, hw); R.y += 0.05;
      const b = i * 2;
      verts.push(L.x, L.y, L.z, R.x, R.y, R.z);
      uvs.push(0, i / samples.length, 1, i / samples.length);
      if (i < samples.length - 2) {
        idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
      // Center dashes
      if (i % 24 < 12) {
        const C = p0.clone(); C.y += 0.10;
        const lb = lVerts.length / 3;
        const CL = C.clone().addScaledVector(right, -0.18);
        const CR = C.clone().addScaledVector(right, 0.18);
        lVerts.push(CL.x, CL.y, CL.z, CR.x, CR.y, CR.z);
        if (lb >= 2) lIdx.push(lb - 2, lb - 1, lb, lb - 1, lb + 1, lb);
      }

      // Wooden Fences (Post-and-rail style)
      const vOff = bVerts.length / 3;

      const addRail = (yBottom, yTop) => {
        const BI = p0.clone().addScaledVector(right, -4.50); BI.y += yBottom;
        const TI = p0.clone().addScaledVector(right, -4.50); TI.y += yTop;
        const TO = p0.clone().addScaledVector(right, -4.56); TO.y += yTop;
        const BO = p0.clone().addScaledVector(right, -4.56); BO.y += yBottom;
        return [BI, TI, TO, BO];
      };

      const addRailR = (yBottom, yTop) => {
        const BI = p0.clone().addScaledVector(right, 4.50); BI.y += yBottom;
        const TI = p0.clone().addScaledVector(right, 4.50); TI.y += yTop;
        const TO = p0.clone().addScaledVector(right, 4.56); TO.y += yTop;
        const BO = p0.clone().addScaledVector(right, 4.56); BO.y += yBottom;
        return [BI, TI, TO, BO];
      };

      const pushV = (vArr) => vArr.forEach(v => bVerts.push(v.x, v.y, v.z));

      pushV(addRail(0.55, 0.65));   // Left Upper
      pushV(addRail(0.30, 0.40));   // Left Lower
      pushV(addRailR(0.55, 0.65));  // Right Upper
      pushV(addRailR(0.30, 0.40));  // Right Lower

      if (i < samples.length - 2) {
        const pushRailIdx = (base, isRight) => {
          if (isRight) {
            bIdx.push(base, base + 1, base + 16, base + 1, base + 17, base + 16);       // inner
            bIdx.push(base + 1, base + 2, base + 17, base + 2, base + 18, base + 17);     // top
            bIdx.push(base + 2, base + 3, base + 18, base + 3, base + 19, base + 18);     // outer
          } else {
            bIdx.push(base, base + 16, base + 1, base + 1, base + 16, base + 17);       // inner
            bIdx.push(base + 1, base + 17, base + 2, base + 2, base + 17, base + 18);     // top
            bIdx.push(base + 2, base + 18, base + 3, base + 3, base + 18, base + 19);     // outer
          }
        };
        pushRailIdx(vOff, false);      // LUR
        pushRailIdx(vOff + 4, false);  // LLR
        pushRailIdx(vOff + 8, true);   // RUR
        pushRailIdx(vOff + 12, true);  // RLR
      }

      // Vertical Posts every 6 segments
      if (i % 6 === 0 && i < samples.length - 1) {
        const pushPost = (isRight) => {
          const poff = bVerts.length / 3;
          const sign = isRight ? 1 : -1;
          const c = p0.clone().addScaledVector(right, sign * 4.53);
          const hw = 0.05, hd = 0.05, h = 0.8;

          const v = [
            c.clone().addScaledVector(right, -hw).addScaledVector(dir, -hd), // 0: BLB
            c.clone().addScaledVector(right, hw).addScaledVector(dir, -hd), // 1: BRB
            c.clone().addScaledVector(right, hw).addScaledVector(dir, hd), // 2: BRF
            c.clone().addScaledVector(right, -hw).addScaledVector(dir, hd), // 3: BLF
            c.clone().addScaledVector(right, -hw).addScaledVector(dir, -hd), // 4: TLB
            c.clone().addScaledVector(right, hw).addScaledVector(dir, -hd), // 5: TRB
            c.clone().addScaledVector(right, hw).addScaledVector(dir, hd), // 6: TRF
            c.clone().addScaledVector(right, -hw).addScaledVector(dir, hd)  // 7: TLF
          ];
          v[4].y += h; v[5].y += h; v[6].y += h; v[7].y += h;
          pushV(v);

          const addQ = (v1, v2, v3, v4) => {
            bIdx.push(poff + v1, poff + v2, poff + v3, poff + v1, poff + v3, poff + v4);
          };

          addQ(1, 0, 4, 5); // Back (-Z)
          addQ(2, 1, 5, 6); // Right (+X)
          addQ(3, 2, 6, 7); // Front (+Z)
          addQ(0, 3, 7, 4); // Left (-X)
          addQ(7, 6, 5, 4); // Top (+Y)
        };
        pushPost(false); // Left post
        pushPost(true);  // Right post
      }
      
      // Streetlights every 18 segments
      if (i % 18 === 0 && i < samples.length - 2) {
        const isRight = (i % 36 === 0);
        const slOff = slVerts.length / 3;
        const sign = isRight ? 1 : -1;
        
        // Base of the pole
        const base = p0.clone().addScaledVector(right, sign * 5.2);
        const top = base.clone(); top.y += 8.0; // 8m tall pole
        const armEnd = top.clone().addScaledVector(right, sign * -2.5); // stick out over road
        
        // Push light position to array
        lightPositions.push(armEnd.clone());

        const w = 0.1; // pole width
        // Create simple pole geometry using vertices
        // We will just do a simple upright box and an arm box
        const pushBox = (pStart, pEnd, boxW) => {
           const dirBox = new THREE.Vector3().subVectors(pEnd, pStart).normalize();
           const upBox = new THREE.Vector3(0,1,0);
           let rightBox = new THREE.Vector3().crossVectors(dirBox, upBox);
           if (rightBox.lengthSq() < 0.001) {
              rightBox = new THREE.Vector3(1,0,0);
           } else {
              rightBox.normalize();
           }
           const frontBox = new THREE.Vector3().crossVectors(rightBox, dirBox).normalize();
           
           const off = slVerts.length / 3;
           const addVert = (pt, rightSign, frontSign) => {
              const v = pt.clone().addScaledVector(rightBox, rightSign*boxW).addScaledVector(frontBox, frontSign*boxW);
              slVerts.push(v.x, v.y, v.z);
           };
           
           addVert(pStart, -1, -1); // 0
           addVert(pStart, 1, -1);  // 1
           addVert(pStart, 1, 1);   // 2
           addVert(pStart, -1, 1);  // 3
           addVert(pEnd, -1, -1);   // 4
           addVert(pEnd, 1, -1);    // 5
           addVert(pEnd, 1, 1);     // 6
           addVert(pEnd, -1, 1);    // 7
           
           const addQuad = (v1, v2, v3, v4) => {
             slIdx.push(off+v1, off+v2, off+v3, off+v1, off+v3, off+v4);
           };
           addQuad(1, 0, 4, 5);
           addQuad(2, 1, 5, 6);
           addQuad(3, 2, 6, 7);
           addQuad(0, 3, 7, 4);
           addQuad(7, 6, 5, 4);
        };
        
        pushBox(base, top, 0.15);
        pushBox(top, armEnd, 0.08);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const b = BIOMES[G.biome];
    // Realistic asphalt: high roughness, very slight metalness for wet-road sheen
    roadMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: b.roadColor,
      roughness: 0.88,
      metalness: 0.04,
    }));
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    if (lVerts.length && lIdx.length) {
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lVerts, 3));
      lg.setIndex(lIdx);
      // Road markings react to lighting (StandardMaterial, not Basic)
      lineMesh = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({
        color: b.lineColor,
        roughness: 0.7,
        metalness: 0.0,
        transparent: true,
        opacity: 0.90,
      }));
      scene.add(lineMesh);
    }

    if (bVerts.length && bIdx.length) {
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(bVerts, 3));
      bg.setIndex(bIdx);
      bg.computeVertexNormals();
      barrierMesh = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({
        color: 0x5c4033, // Dark rustic wood color
        roughness: 0.95,
        metalness: 0.0
      }));
      barrierMesh.castShadow = true;
      barrierMesh.receiveShadow = true;
      scene.add(barrierMesh);
    }

    if (slVerts.length && slIdx.length) {
      if (streetlightMesh) { scene.remove(streetlightMesh); streetlightMesh.geometry.dispose(); }
      const slg = new THREE.BufferGeometry();
      slg.setAttribute('position', new THREE.Float32BufferAttribute(slVerts, 3));
      slg.setIndex(slIdx);
      slg.computeVertexNormals();
      streetlightMesh = new THREE.Mesh(slg, new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.5
      }));
      streetlightMesh.castShadow = true;
      scene.add(streetlightMesh);
    }
  }

  function buildTerrainSide(side) {
    const SIDE_W = 180, SIDE_SEGS_LAT = 24, CURVE_SEGS = 400;
    const pts2 = curve.getPoints(CURVE_SEGS);
    const up3 = new THREE.Vector3(0, 1, 0);
    const verts = [], idxArr = [], normals = [];

    for (let i = 0; i <= CURVE_SEGS; i++) {
      const p = pts2[Math.min(i, pts2.length - 1)];
      const pN = pts2[Math.min(i + 1, pts2.length - 1)];
      const dir = new THREE.Vector3().subVectors(pN, p).normalize();
      const right = new THREE.Vector3().crossVectors(dir, up3).normalize();
      for (let s = 0; s <= SIDE_SEGS_LAT; s++) {
        const t = s / SIDE_SEGS_LAT;
        const dist = ROAD_W / 2 + t * SIDE_W;
        const wp = p.clone().addScaledVector(right, side * dist);
        const noise = Noise.fbm(wp.x * 0.012, wp.z * 0.012, 5) * 28;
        const slope = t * t * 18;
        wp.y = p.y + slope + noise * t;
        verts.push(wp.x, wp.y, wp.z);
        normals.push(0, 1, 0);
      }
    }
    for (let i = 0; i < CURVE_SEGS; i++) {
      for (let s = 0; s < SIDE_SEGS_LAT; s++) {
        const a = i * (SIDE_SEGS_LAT + 1) + s;
        if (side === 1) {
          idxArr.push(a, a + 1, a + SIDE_SEGS_LAT + 1, a + 1, a + SIDE_SEGS_LAT + 2, a + SIDE_SEGS_LAT + 1);
        } else {
          // Invert winding order for the left side so normals point UP instead of DOWN
          idxArr.push(a, a + SIDE_SEGS_LAT + 1, a + 1, a + 1, a + SIDE_SEGS_LAT + 1, a + SIDE_SEGS_LAT + 2);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idxArr);
    geo.computeVertexNormals();
    const b = BIOMES[G.biome];
    // Terrain: matte ground material
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: b.groundColor,
      roughness: 1.0,
      metalness: 0.0,
    }));
    mesh.receiveShadow = true;
    return mesh;
  }

  function buildTerrain() {
    if (terrainL) { scene.remove(terrainL); terrainL.geometry.dispose(); }
    if (terrainR) { scene.remove(terrainR); terrainR.geometry.dispose(); }
    terrainL = buildTerrainSide(-1); scene.add(terrainL);
    terrainR = buildTerrainSide(1); scene.add(terrainR);
  }

  function buildAll() {
    buildCurve();
    buildRoad();
    buildTerrain();
  }

  // Returns { pos, quat } for car placement at roadT + lateralOffset
  function getCarTransform(offset = G.lateralOffset) {
    const t = Math.min(G.roadT, 0.9999);
    const roadPos = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const up3 = new THREE.Vector3(0, 1, 0);
    const right3 = new THREE.Vector3().crossVectors(tangent, up3).normalize();

    const pos = roadPos.clone().addScaledVector(right3, offset);
    pos.y += 0.38; // sit car on road

    const forward = tangent.clone().negate(); // car faces -Z local
    const quat = new THREE.Quaternion();
    const m = new THREE.Matrix4().lookAt(pos, pos.clone().add(tangent), up3);
    quat.setFromRotationMatrix(m);

    return { pos, quat, right: right3 };
  }

  function advance(dt) {
    const len = curve.getLength();
    const tPerSec = G.carSpeed / len;
    G.roadT += tPerSec * dt;
    G.distance += G.carSpeed * dt;

    // Regenerate when nearing the end
    if (G.roadT > REBUILD_T) {
      const drop = Math.floor(pts.length * 0.3);

      // Calculate exact physical offset before splicing to prevent teleporting
      const numSegments = pts.length - 1;
      const currentSegmentIndex = G.roadT * numSegments;
      const newSegmentIndex = currentSegmentIndex - drop;

      pts.splice(0, drop);
      for (let i = 0; i < drop; i++) pts.push(nextPoint(pts[pts.length - 1]));

      buildAll();
      G.roadT = Math.max(0.01, newSegmentIndex / numSegments);
    }
  }

  function applyBiome() {
    if (roadMesh) roadMesh.material.color.setHex(BIOMES[G.biome].roadColor);
    if (lineMesh) lineMesh.material.color.setHex(BIOMES[G.biome].lineColor);
    if (terrainL) terrainL.material.color.setHex(BIOMES[G.biome].groundColor);
    if (terrainR) terrainR.material.color.setHex(BIOMES[G.biome].groundColor);
  }

  function getCurveLen() {
    return curve ? curve.getLength() : 3000;
  }

  function getCurvePoint(t) {
    if (!curve) return new THREE.Vector3(0, 0, -t * 3000);
    return curve.getPoint(t);
  }

  function getLightPositions() {
    return lightPositions;
  }

  return { init, advance, getCarTransform, applyBiome, getCurveLen, getCurvePoint, getLightPositions };
})();

// _getPointAt: returns { pos, quat } for traffic module
Road._getPointAt = function (t, offset) {
  try {
    const _t = Math.max(0.001, Math.min(0.999, t));
    // Reuse getCarTransform logic but at arbitrary t
    // We temporarily override G.roadT
    const savedT = G.roadT;
    G.roadT = _t;
    const result = Road.getCarTransform(offset !== undefined ? offset : G.lateralOffset);
    G.roadT = savedT;
    return result;
  } catch (e) { return null; }
};
Road._curveLen = 3000; // approximate, updated each frame
