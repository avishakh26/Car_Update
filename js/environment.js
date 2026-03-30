// ============================================================
// ENVIRONMENT.JS — Realistic trees, grass, clouds, mountains
// ============================================================

const Environment = (() => {
  const TREE_COUNT = 1500;
  const GRASS_COUNT = 3000;
  const CLOUD_COUNT = 22;
  const MTN_COUNT = 18;

  let cloudMeshes = [];
  let mountainGroup = null;
  let dummy = new THREE.Object3D();

  let pineInst = null, pineTrunkInst = null;
  let oakInst = null, oakTrunkInst = null;
  let palmInst = null, palmTrunkInst = null;
  let tamariskInst = null;
  let treePositions = { pine: [], oak: [], palm: [], tamarisk: [] };

  // --- PROCEDURAL GEOMETRY COMPILER ---
  function _mergeGeometries(geometries) {
    if (!geometries || geometries.length === 0) return new THREE.BufferGeometry();
    let numVerts = 0, numIndices = 0;

    const processed = geometries.map(g => {
      let clone = g.clone();
      if (!clone.index) {
        const posCount = clone.attributes.position.count;
        const indices = new Uint16Array(posCount);
        for (let i = 0; i < posCount; i++) indices[i] = i;
        clone.setIndex(new THREE.BufferAttribute(indices, 1));
      }
      numVerts += clone.attributes.position.count;
      numIndices += clone.index.count;
      return clone;
    });

    const mergedPositions = new Float32Array(numVerts * 3);
    const mergedNormals = new Float32Array(numVerts * 3);
    // Uint32 allows combining huge clusters without crashing index bounds limits
    const mergedIndices = new Uint32Array(numIndices);

    let vOffset = 0, iOffset = 0;
    for (let g of processed) {
      const pAttr = g.attributes.position;
      const nAttr = g.attributes.normal;
      const iAttr = g.index;
      mergedPositions.set(pAttr.array, vOffset * 3);
      if (nAttr) mergedNormals.set(nAttr.array, vOffset * 3);
      for (let i = 0; i < iAttr.count; i++) mergedIndices[iOffset + i] = iAttr.array[i] + vOffset;
      vOffset += pAttr.count;
      iOffset += iAttr.count;
    }

    const finalGeo = new THREE.BufferGeometry();
    finalGeo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
    if (processed[0].attributes.normal) finalGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
    finalGeo.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
    return finalGeo;
  }

  function generatePineDetails() {
    const trunkGeos = [], folGeos = [];
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.25, 4, 6);
    trunkGeo.translate(0, 2, 0);
    trunkGeos.push(trunkGeo);

    const tiers = 8;
    for (let t = 0; t < tiers; t++) {
      const height = 0.8 + (t / tiers) * 3.5;
      const numBranches = 5 + Math.floor(Math.random() * 3);
      const tierRadius = 1.8 * (1 - t / tiers + 0.1);
      for (let b = 0; b < numBranches; b++) {
        const angle = (b / numBranches) * Math.PI * 2 + (Math.random() * 0.5);
        const branchLen = tierRadius * (0.8 + Math.random() * 0.4);
        const bGeo = new THREE.ConeGeometry(branchLen * 0.4, branchLen, 5);
        bGeo.translate(0, branchLen / 2, 0);
        const m = new THREE.Matrix4();
        m.multiply(new THREE.Matrix4().makeTranslation(0, height, 0));
        m.multiply(new THREE.Matrix4().makeRotationY(angle));
        m.multiply(new THREE.Matrix4().makeRotationZ(-Math.PI / 2 - 0.2));
        bGeo.applyMatrix4(m);
        folGeos.push(bGeo);
      }
    }
    const topGeo = new THREE.ConeGeometry(0.3, 1.0, 5);
    topGeo.translate(0, 4.5, 0);
    folGeos.push(topGeo);
    return { trunk: _mergeGeometries(trunkGeos), foliage: _mergeGeometries(folGeos) };
  }

  function generateOakDetails() {
    const trunkGeos = [], folGeos = [];
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.5, 6);
    trunkGeo.translate(0, 1.25, 0);
    trunkGeos.push(trunkGeo);

    const numClusters = 18;
    for (let c = 0; c < numClusters; c++) {
      const radiusDist = Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radiusDist;
      const z = Math.sin(angle) * radiusDist;
      const height = 2.0 + Math.random() * 2.5 - radiusDist * 0.4;
      const size = 0.8 + Math.random() * 0.8;
      const cGeo = new THREE.IcosahedronGeometry(size, 1);
      cGeo.scale(1.0, 0.7 + Math.random() * 0.3, 1.0);
      cGeo.translate(x, height, z);
      folGeos.push(cGeo);
    }
    return { trunk: _mergeGeometries(trunkGeos), foliage: _mergeGeometries(folGeos) };
  }

  function generatePalmDetails() {
    const trunkGeos = [], folGeos = [];
    const segments = 6;
    let currPos = new THREE.Vector3(0, 0, 0);
    for (let s = 0; s < segments; s++) {
      const h = 0.8;
      const rad = 0.22 - (s / segments) * 0.1;
      const pGeo = new THREE.CylinderGeometry(rad * 0.8, rad, h, 6);
      pGeo.translate(0, h / 2, 0);
      const m = new THREE.Matrix4();
      m.makeTranslation(currPos.x, currPos.y, currPos.z);
      m.multiply(new THREE.Matrix4().makeRotationZ(s * 0.06));
      pGeo.applyMatrix4(m);
      trunkGeos.push(pGeo);
      const up = new THREE.Vector3(0, h, 0).applyMatrix4(new THREE.Matrix4().makeRotationZ(s * 0.06));
      currPos.add(up);
    }
    const numFronds = 10;
    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2 + Math.random() * 0.2;
      const len = 3.0 + Math.random() * 1.0;
      const fGeo = new THREE.ConeGeometry(len * 0.25, len, 5);
      fGeo.translate(0, len / 2, 0);
      const m = new THREE.Matrix4();
      m.multiply(new THREE.Matrix4().makeTranslation(currPos.x, currPos.y, currPos.z));
      m.multiply(new THREE.Matrix4().makeRotationY(angle));
      m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 + 0.4 + Math.random() * 0.2));
      m.multiply(new THREE.Matrix4().makeScale(1, 1, 0.05));
      fGeo.applyMatrix4(m);
      folGeos.push(fGeo);
    }
    return { trunk: _mergeGeometries(trunkGeos), foliage: _mergeGeometries(folGeos) };
  }

  function generateTamariskDetails() {
    const folGeos = [];
    const numClusters = 12;
    for (let c = 0; c < numClusters; c++) {
      const radiusDist = Math.random() * 2.0;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radiusDist;
      const z = Math.sin(angle) * radiusDist;
      const height = (2.5 - radiusDist * 0.8) * Math.random() + 0.4;
      const size = 0.8 + Math.random() * 0.8;
      const cGeo = new THREE.IcosahedronGeometry(size, 1);
      cGeo.scale(1.0, 0.6 + Math.random() * 0.4, 1.0);
      cGeo.translate(x, height, z);
      folGeos.push(cGeo);
    }
    return { trunk: new THREE.BufferGeometry(), foliage: _mergeGeometries(folGeos) };
  }

  function buildTrees() {
    [pineInst, pineTrunkInst, oakInst, oakTrunkInst, palmInst, palmTrunkInst, tamariskInst].forEach(m => {
      if (m) scene.remove(m);
    });

    const b = BIOMES[G.biome];

    // Generate massive baked geometries once
    const pineGeo = generatePineDetails();
    const oakGeo = generateOakDetails();
    const palmGeo = generatePalmDetails();
    const tamGeo = generateTamariskDetails();

    const fMatPine = new THREE.MeshStandardMaterial({ color: b.treeColor, roughness: 0.88, flatShading: true });
    const oakColor = new THREE.Color(b.treeColor).multiplyScalar(0.85);
    const fMatOak = new THREE.MeshStandardMaterial({ color: oakColor, roughness: 0.85, flatShading: true });
    const palmColor = new THREE.Color(b.treeColor).multiplyScalar(1.2);
    const fMatPalm = new THREE.MeshStandardMaterial({ color: palmColor, roughness: 0.8, flatShading: true });
    const tamColor = new THREE.Color(b.treeColor).lerp(new THREE.Color(0xd2c2a0), 0.35);
    const fMatTam = new THREE.MeshStandardMaterial({ color: tamColor, roughness: 0.85, flatShading: true });

    const trkMat = new THREE.MeshStandardMaterial({ color: b.trunkColor, roughness: 1.0 });

    pineInst = new THREE.InstancedMesh(pineGeo.foliage, fMatPine, TREE_COUNT);
    pineTrunkInst = new THREE.InstancedMesh(pineGeo.trunk, trkMat, TREE_COUNT);
    oakInst = new THREE.InstancedMesh(oakGeo.foliage, fMatOak, TREE_COUNT);
    oakTrunkInst = new THREE.InstancedMesh(oakGeo.trunk, trkMat, TREE_COUNT);
    palmInst = new THREE.InstancedMesh(palmGeo.foliage, fMatPalm, TREE_COUNT);
    palmTrunkInst = new THREE.InstancedMesh(palmGeo.trunk, trkMat, TREE_COUNT);
    tamariskInst = new THREE.InstancedMesh(tamGeo.foliage, fMatTam, TREE_COUNT);

    [pineInst, pineTrunkInst, oakInst, oakTrunkInst, palmInst, palmTrunkInst, tamariskInst].forEach(m => {
      m.castShadow = true;
      m.frustumCulled = false;
      scene.add(m);
    });

    _generateTreePositions();
    _uploadTreeMatrices();
  }

  function _generateTreePositions() {
    treePositions = { pine: [], oak: [], palm: [], tamarisk: [] };
    
    // Generate full dense set for each type
    const generateForType = (typeList, baseCount, latMin, latMax) => {
      for (let i = 0; i < baseCount; i++) {
        const t = Math.random();
        const roadPt = Road.getCurvePoint(t);
        const nextPt = Road.getCurvePoint(Math.min(1, t + 0.001));
        const dir = new THREE.Vector3().subVectors(nextPt, roadPt).normalize();
        const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize();

        const side = Math.random() > 0.5 ? 1 : -1;
        // Erased trees that float by restricting max lateral expansion (e.g. 40 not 84)
        const lateralDist = latMin + Math.random() * (latMax - latMin);
        
        const spawnPt = roadPt.clone().addScaledVector(right, side * lateralDist);
        // add slight natural variance along spline
        spawnPt.addScaledVector(dir, (Math.random() - 0.5) * 10);
        const x = spawnPt.x;
        const z = spawnPt.z;
        
        // Exact matching terrain slope calculation
        const t_terrain = (lateralDist - 3.5) / 180;
        const noise = Noise.fbm(x * 0.012, z * 0.012, 5) * 28;
        const y = roadPt.y + (t_terrain * t_terrain * 18) + (noise * t_terrain) - 0.2;
        
        const scale = 0.5 + Math.random() * 0.7;
        const rotY = Math.random() * Math.PI * 2;
        typeList.push({ x, y, z, scale, rotY });
      }
    };

    // Restore dense forest by filling entirely up to TREE_COUNT
    // INCREASED max lateral spawning dramatically (up to 175m) to carpet the barren distant horizon
    generateForType(treePositions.pine, TREE_COUNT, 9, 160);
    generateForType(treePositions.oak, TREE_COUNT, 12, 170);
    generateForType(treePositions.palm, TREE_COUNT, 8, 150);
    generateForType(treePositions.tamarisk, TREE_COUNT, 7, 140);
  }

  function _uploadTreeMatrices() {
    const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);

    const applyArray = (inst, trunkInst, arr) => {
      if (!inst) return;
      for (let i = 0; i < TREE_COUNT; i++) {
        if (arr[i]) {
          const m = new THREE.Matrix4();
          m.makeTranslation(arr[i].x, arr[i].y, arr[i].z);
          m.multiply(new THREE.Matrix4().makeRotationY(arr[i].rotY));
          m.multiply(new THREE.Matrix4().makeScale(arr[i].scale, arr[i].scale, arr[i].scale));
          inst.setMatrixAt(i, m);
          if (trunkInst) trunkInst.setMatrixAt(i, m);
        } else {
          inst.setMatrixAt(i, HIDDEN);
          if (trunkInst) trunkInst.setMatrixAt(i, HIDDEN);
        }
      }
      inst.instanceMatrix.needsUpdate = true;
      if (trunkInst) trunkInst.instanceMatrix.needsUpdate = true;
    };

    // Palm specific biome switch logic
    const b = BIOMES[G.biome];
    const isDesert = b.treeColor === 0x8DAA78 || b.roadColor === 0x4D4B4E;

    // Control density mathematically per biome
    applyArray(pineInst, pineTrunkInst, isDesert ? [] : treePositions.pine);
    applyArray(oakInst, oakTrunkInst, isDesert ? [] : treePositions.oak);
    applyArray(palmInst, palmTrunkInst, isDesert ? treePositions.palm : treePositions.palm.slice(0, TREE_COUNT * 0.15));
    applyArray(tamariskInst, null, treePositions.tamarisk);
  }

  function _getCarPos() {
    try { return Road.getCarTransform().pos; } catch (e) { return new THREE.Vector3(0, 0, 0); }
  }

  // ---- GRASS (denser, multi-angle blades) ----
  let grassInst = null;
  let grassInst2 = null; // cross-blade for volume

  function buildGrass() {
    if (grassInst) scene.remove(grassInst);
    if (grassInst2) scene.remove(grassInst2);

    const b = BIOMES[G.biome];
    const geo = new THREE.PlaneGeometry(0.35, 1.1);
    geo.translate(0, 0.55, 0);

    const c = new THREE.Color(b.groundColor);
    // Make grass more saturated and slightly brighter than ground
    c.r = Math.min(1, c.r * 0.7 + 0.04);
    c.g = Math.min(1, c.g * 1.15);
    c.b = Math.min(1, c.b * 0.75);

    const mat = new THREE.MeshStandardMaterial({
      color: c,
      roughness: 1.0,
      side: THREE.DoubleSide,
    });
    grassInst = new THREE.InstancedMesh(geo, mat, GRASS_COUNT);
    grassInst2 = new THREE.InstancedMesh(geo, mat.clone(), GRASS_COUNT);
    grassInst.receiveShadow = false;
    grassInst2.receiveShadow = false;
    grassInst.frustumCulled = false;
    grassInst2.frustumCulled = false;

    _placeGrass();
    scene.add(grassInst);
    scene.add(grassInst2);
  }

  function _placeGrass() {
    for (let i = 0; i < GRASS_COUNT; i++) {
      const t = Math.random();
      const roadPt = Road.getCurvePoint(t);
      const nextPt = Road.getCurvePoint(Math.min(1, t + 0.001));
      const dir = new THREE.Vector3().subVectors(nextPt, roadPt).normalize();
      const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize();

      const side = Math.random() > 0.5 ? 1 : -1;
      const lat = 5.0 + Math.random() * 165; // Extended to horizon

      const spawnPt = roadPt.clone().addScaledVector(right, side * lat);
      spawnPt.addScaledVector(dir, (Math.random() - 0.5) * 14);

      const x = spawnPt.x;
      const z = spawnPt.z;

      const t_terrain = (lat - 3.5) / 180;
      const noise = Noise.fbm(x * 0.012, z * 0.012, 5) * 28;
      const y = roadPt.y + (t_terrain * t_terrain * 18) + (noise * t_terrain) + 0.05;

      const scale = 0.5 + Math.random() * 0.75;
      const tilt = (Math.random() - 0.5) * 0.45; // natural lean

      dummy.position.set(x, y, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(tilt, Math.random() * Math.PI, tilt * 0.6);
      dummy.updateMatrix();
      grassInst.setMatrixAt(i, dummy.matrix);

      // Cross blade (90 degrees rotated = volumetric look)
      dummy.rotation.set(tilt, Math.random() * Math.PI + Math.PI / 2, tilt * 0.6);
      dummy.updateMatrix();
      grassInst2.setMatrixAt(i, dummy.matrix);
    }
    grassInst.instanceMatrix.needsUpdate = true;
    grassInst2.instanceMatrix.needsUpdate = true;
  }

  // ---- CLOUDS (volumetric puff style) ----
  function buildClouds() {
    cloudMeshes.forEach(m => scene.remove(m));
    cloudMeshes = [];
    const b = BIOMES[G.biome];
    const cloudBaseMat = new THREE.MeshStandardMaterial({
      color: b.cloudColor,
      roughness: 1.0,
      transparent: true,
      opacity: 0.82,
    });

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 5);
      for (let p = 0; p < puffs; p++) {
        const r = 6 + Math.random() * 10;
        const geo = new THREE.SphereGeometry(r, 9, 6);
        const m = new THREE.Mesh(geo, cloudBaseMat.clone());
        m.position.set(
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 12
        );
        // Slightly darker underside for volumetric look
        m.material.color = new THREE.Color(b.cloudColor).multiplyScalar(
          0.85 + Math.random() * 0.2
        );
        cloud.add(m);
      }
      cloud.position.set(
        (Math.random() - 0.5) * 800,
        80 + Math.random() * 80,
        -Math.random() * 700
      );
      cloud.userData.speed = 0.4 + Math.random() * 1.2;
      cloud.userData.driftX = (Math.random() - 0.5) * 0.25;
      scene.add(cloud);
      cloudMeshes.push(cloud);
    }
  }

  // ---- MOUNTAINS (realistic jagged peaks with snow caps) ----
  let snowCapGroup = null;

  function buildMountains() {
    if (mountainGroup) scene.remove(mountainGroup);
    if (snowCapGroup) scene.remove(snowCapGroup);
    mountainGroup = new THREE.Group();
    snowCapGroup = new THREE.Group();

    const b = BIOMES[G.biome];
    const mtnMat = new THREE.MeshStandardMaterial({ color: b.mountainColor, roughness: 1.0, flatShading: true });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xe8eef5, roughness: 0.85, flatShading: true });

    for (let i = 0; i < MTN_COUNT; i++) {
      const h = 180 + Math.random() * 250;
      const w = 120 + Math.random() * 160;
      const segs = 16 + Math.floor(Math.random() * 8); // High segmentation for photorealism
      const hSegs = 12; 
      const geo = new THREE.ConeGeometry(w, h, segs, hSegs, true); 

      // Jagged Fractal Deformation
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let j = 0; j < pos.count; j++) {
        v.fromBufferAttribute(pos, j);
        const heightFac = 1.0 - (Math.max(0, v.y) / (h / 2)); // 1.0 at base, 0.0 at peak
        if (heightFac > 0.05) {
          const n = Noise.fbm(v.x * 0.03 + i * 20, v.y * 0.05, 5) * 35 * heightFac;
          const r = Math.sqrt(v.x * v.x + v.z * v.z);
          if (r !== 0) {
            v.x += (v.x / r) * n;
            v.z += (v.z / r) * n;
          }
        }
        pos.setXYZ(j, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();

      const m = new THREE.Mesh(geo, mtnMat.clone());
      // Push mountains far back (600+ meters) to prevent any clipping, scale parallax handles camera tracking
      const sideDist = 600 + Math.random() * 400; 
      const side = (i % 2 === 0 ? 1 : -1) * sideDist;
      const zPos = -300 - Math.random() * 1200;
      m.position.set(side, h / 2 - 15, zPos);
      m.castShadow = true;
      m.userData.baseX = sideDist * (i % 2 === 0 ? 1 : -1);
      mountainGroup.add(m);

      // Snow cap (jagged matching)
      if (G.biome !== 'desert') {
        const capH = h * 0.40;
        const capW = w * 0.45;
        const capGeo = new THREE.ConeGeometry(capW, capH, segs, 5, true);
        const cPos = capGeo.attributes.position;
        for (let j = 0; j < cPos.count; j++) {
          v.fromBufferAttribute(cPos, j);
          const heightFac = 1.0 - (Math.max(0, v.y) / (capH / 2));
          if (heightFac > 0.05) {
            const n = Noise.fbm(v.x * 0.03 + i * 20, (v.y + h - capH) * 0.05, 5) * 35 * heightFac;
            const r = Math.sqrt(v.x * v.x + v.z * v.z);
            if (r !== 0) {
              v.x += (v.x / r) * n;
              v.z += (v.z / r) * n;
            }
          }
          cPos.setXYZ(j, v.x, v.y, v.z);
        }
        capGeo.computeVertexNormals();

        const cap = new THREE.Mesh(capGeo, snowMat.clone());
        cap.position.set(side, h - capH * 0.5 - 15, zPos);
        cap.userData.baseX = m.userData.baseX;
        snowCapGroup.add(cap);
      }
    }
    scene.add(mountainGroup);
    scene.add(snowCapGroup);
  }

  // ---- LIFECYCLE ----
  function init() {
    buildClouds();
    buildMountains();
  }

  function initTrees() {
    buildTrees();
    buildGrass();
  }

  let _treeRefreshTimer = 0;

  function update(dt, carPos) {
    // Clouds drift slowly
    if (!carPos) carPos = _getCarPos();
    cloudMeshes.forEach(c => {
      const dz = c.position.z - carPos.z;
      if (dz > 250) c.position.z = carPos.z - 700;
      c.position.z += 1.8 * dt;
      c.position.y += Math.sin(Date.now() * 0.00008 + c.userData.speed) * 0.018;
    });

    // Mountains follow player smoothly with deep parallax tracing
    const followGroups = [mountainGroup, snowCapGroup].filter(Boolean);
    followGroups.forEach(group => {
      group.children.forEach(m => {
        const dz = m.position.z - carPos.z;
        if (dz > 400) {
          m.position.z -= 1600;
        }
        // Parallax anchoring: x shifts continuously at 90% of car movement.
        // This guarantees mountains forever stay safely isolated on the horizon while producing massive depth perception.
        m.position.x = (carPos.x * 0.9) + m.userData.baseX;
      });
    });

    // === CONTINUOUS TRUE OBJECT STREAMING ===
    // Seamlessly recycle instances that fall behind the car and securely spawn them far ahead in the unseen fog.
    let treesUpdated = false;
    const streamTrees = (arr, inst, trunkInst, latMin, latMax) => {
      if (!inst) return;
      for(let i=0; i<arr.length; i++) {
        if (!arr[i]) continue;
        if (arr[i].z > carPos.z + 50) {
          // Send back into the fog (convert fractional distance to guarantee 600m to 1200m ahead of camera)
          const cLen = Road.getCurveLen() || 3000;
          const targetT = Math.min(0.99, G.roadT + (600 / cLen) + Math.random() * (600 / cLen));
          const roadPt = Road.getCurvePoint(targetT);
          const nextPt = Road.getCurvePoint(Math.min(1, targetT + 0.001));
          const dir = new THREE.Vector3().subVectors(nextPt, roadPt).normalize();
          const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
          const side = Math.random() > 0.5 ? 1 : -1;
          const lateralDist = latMin + Math.random() * (latMax - latMin);
          
          const spawnPt = roadPt.clone().addScaledVector(right, side * lateralDist);
          spawnPt.addScaledVector(dir, (Math.random() - 0.5) * 10);
          const t_terrain = (lateralDist - 3.5) / 180;
          const noise = Noise.fbm(spawnPt.x * 0.012, spawnPt.z * 0.012, 5) * 28;
          const y = roadPt.y + (t_terrain * t_terrain * 18) + (noise * t_terrain) - 0.2;
          
          arr[i].x = spawnPt.x; arr[i].y = y; arr[i].z = spawnPt.z;
          const m = new THREE.Matrix4();
          m.makeTranslation(arr[i].x, arr[i].y, arr[i].z);
          m.multiply(new THREE.Matrix4().makeRotationY(arr[i].rotY));
          m.multiply(new THREE.Matrix4().makeScale(arr[i].scale, arr[i].scale, arr[i].scale));
          inst.setMatrixAt(i, m);
          if (trunkInst) trunkInst.setMatrixAt(i, m);
          treesUpdated = true;
        }
      }
    };

    const b = BIOMES[G.biome];
    const isDesert = b.treeColor === 0x8DAA78 || b.roadColor === 0x4D4B4E;
    
    streamTrees(treePositions.pine, pineInst, pineTrunkInst, 9, 160);
    streamTrees(treePositions.oak, oakInst, oakTrunkInst, 12, 170);
    streamTrees(treePositions.palm, palmInst, palmTrunkInst, 8, 150);
    streamTrees(treePositions.tamarisk, tamariskInst, null, 7, 140);

    if (treesUpdated) {
      [pineInst, pineTrunkInst, oakInst, oakTrunkInst, palmInst, palmTrunkInst, tamariskInst].forEach(inst => {
          if (inst) inst.instanceMatrix.needsUpdate = true;
      });
    }

    // Stream Grass
    let grassUpdated = false;
    const mGrass = new THREE.Matrix4();
    const posGrass = new THREE.Vector3();
    const vScale = new THREE.Vector3();
    const qRot = new THREE.Quaternion();
    
    if (grassInst && grassInst2) {
      for (let i = 0; i < GRASS_COUNT; i++) {
        grassInst.getMatrixAt(i, mGrass);
        posGrass.setFromMatrixPosition(mGrass);
        
        if (posGrass.z > carPos.z + 50) {
          const cLen = Road.getCurveLen() || 3000;
          const targetT = Math.min(0.99, G.roadT + (500 / cLen) + Math.random() * (700 / cLen));
          const roadPt = Road.getCurvePoint(targetT);
          const nextPt = Road.getCurvePoint(Math.min(1, targetT + 0.001));
          const dir = new THREE.Vector3().subVectors(nextPt, roadPt).normalize();
          const right = new THREE.Vector3(dir.z, 0, -dir.x).normalize();
          const side = Math.random() > 0.5 ? 1 : -1;
          const lat = 5.0 + Math.random() * 165;
          const spawnPt = roadPt.clone().addScaledVector(right, side * lat);
          spawnPt.addScaledVector(dir, (Math.random() - 0.5) * 14);
          
          const t_terrain = (lat - 3.5) / 180;
          const noise = Noise.fbm(spawnPt.x * 0.012, spawnPt.z * 0.012, 5) * 28;
          const y = roadPt.y + (t_terrain * t_terrain * 18) + (noise * t_terrain) + 0.05;
          
          mGrass.decompose(posGrass, qRot, vScale);
          
          // Rebuild matrices identical directly without expensive decomposed euler
          dummy.position.set(spawnPt.x, y, spawnPt.z);
          dummy.scale.copy(vScale);
          // Need tilt from euler logic? We can just randomize!
          const tilt = (Math.random() - 0.5) * 0.45;
          dummy.rotation.set(tilt, Math.random() * Math.PI, tilt * 0.6);
          dummy.updateMatrix();
          grassInst.setMatrixAt(i, dummy.matrix);
          
          dummy.rotation.set(tilt, Math.random() * Math.PI + Math.PI / 2, tilt * 0.6);
          dummy.updateMatrix();
          grassInst2.setMatrixAt(i, dummy.matrix);
          
          grassUpdated = true;
        }
      }
      if (grassUpdated) {
        grassInst.instanceMatrix.needsUpdate = true;
        grassInst2.instanceMatrix.needsUpdate = true;
      }
    }
  }

  function applyBiome() {
    const b = BIOMES[G.biome];
    if (pineInst) pineInst.material.color.setHex(b.treeColor);
    if (oakInst) oakInst.material.color.copy(new THREE.Color(b.treeColor).multiplyScalar(0.85));
    if (palmInst) palmInst.material.color.copy(new THREE.Color(b.treeColor).multiplyScalar(1.2));
    if (tamariskInst) tamariskInst.material.color.copy(new THREE.Color(b.treeColor).lerp(new THREE.Color(0xd2c2a0), 0.35));

    if (pineTrunkInst) pineTrunkInst.material.color.setHex(b.trunkColor);
    if (oakTrunkInst) oakTrunkInst.material.color.setHex(b.trunkColor);
    if (palmTrunkInst) palmTrunkInst.material.color.setHex(b.trunkColor);

    cloudMeshes.forEach(c => c.children.forEach(m => m.material.color.setHex(b.cloudColor)));

    if (mountainGroup) {
      mountainGroup.children.forEach(m => m.material.color.setHex(b.mountainColor));
    }

    if (grassInst) {
      const c = new THREE.Color(b.groundColor);
      c.r = Math.min(1, c.r * 0.7 + 0.04);
      c.g = Math.min(1, c.g * 1.15);
      c.b = Math.min(1, c.b * 0.75);
      grassInst.material.color.copy(c);
      if (grassInst2) grassInst2.material.color.copy(c);
    }
  }

  function refreshTrees() {
    _generateTreePositions();
    _uploadTreeMatrices();
    _placeGrass();
  }

  return { init, initTrees, update, applyBiome, refreshTrees };
})();
