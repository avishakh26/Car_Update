// ============================================================
// CONFIG.JS — Photorealistic biomes, constants, shared state
// ============================================================

const BIOMES = {
  meadow: {
    groundColor: 0x4d7c3a,   // rich green grass
    roadColor: 0x252525,   // dark asphalt
    skyTop: new THREE.Color(0x1a457b),   // deep noon blue
    skyHorizon: new THREE.Color(0xaed3e8),   // soft atmospheric horizon
    fogColor: 0xa1d5ed,
    treeColor: 0x2e6b38,   // deep forest green
    trunkColor: 0x5c3d22,   // warm brown bark
    mountainColor: 0x3a5c30,
    ambientColor: 0xfff5e8,
    sunColor: new THREE.Color(0xfff8f0),
    lineColor: 0xf5f5f5,
    cloudColor: 0xffffff,
  },
  autumn: {
    groundColor: 0x8a5a30,   // earthy ochre
    roadColor: 0x252525,
    skyTop: new THREE.Color(0x2d4a7a),   // moody blue
    skyHorizon: new THREE.Color(0xe8a050),   // warm amber horizon
    fogColor: 0xd4a060,
    treeColor: 0xc05510,   // burnt orange foliage
    trunkColor: 0x4a2e12,   // dark warm bark
    mountainColor: 0x8a4025,
    ambientColor: 0xffd8aa,
    sunColor: new THREE.Color(0xffcc55),
    lineColor: 0xffe890,
    cloudColor: 0xffe8d0,
  },
  snow: {
    groundColor: 0xd8e8f8,   // cold white snow
    roadColor: 0x3a4a55,   // wet dark asphalt
    skyTop: new THREE.Color(0x4060a0),   // cold steel blue
    skyHorizon: new THREE.Color(0xb8d0e8),   // icy horizon
    fogColor: 0xc8dce8,
    treeColor: 0x1e3a1e,   // dark pine
    trunkColor: 0x3a2e20,
    mountainColor: 0x7a90a8,   // grey-blue rocky peaks
    ambientColor: 0xd0e8ff,
    sunColor: new THREE.Color(0xe8f0ff),
    lineColor: 0xffffff,
    cloudColor: 0xe8eef8,
  },
  desert: {
    groundColor: 0xc8943a,   // warm sand
    roadColor: 0x404833,   // bleached asphalt
    skyTop: new THREE.Color(0x3a78c8),   // intense noon blue
    skyHorizon: new THREE.Color(0xf5cc60),   // dusty yellow horizon
    fogColor: 0xe8c860,
    treeColor: 0x5a7820,   // scrub/cacti
    trunkColor: 0x7a6040,
    mountainColor: 0xb87830,   // sandstone ochre
    ambientColor: 0xffe8b8,
    sunColor: new THREE.Color(0xffee44),
    lineColor: 0xfff8a0,
    cloudColor: 0xfff8e8,
  },
};

const G = {
  // Biome / scene
  biome: 'meadow',
  timeOfDay: 0.38,    // 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
  weather: 'clear',  // 'clear' | 'rain' | 'snow'
  fogNear: 90,
  fogFar: 300,

  // Car physics
  carSpeed: 0,         // current speed (units/sec)
  maxSpeed: 60,        // max speed units/sec (~120 km/h display)
  acceleration: 18,
  braking: 30,
  lateralOffset: 0,   // offset from road center
  targetOffset: 0,
  lateralVel: 0,
  steerForce: 2000,
  steerFriction: 0.20,

  // Road traversal
  roadT: 0.05,        // 0..1 position along curve
  distance: 0,        // total meters driven

  // Flags
  started: false,
  autodrive: false,
  crashed: 0,

  // Input
  keys: { left: false, right: false, up: false, down: false },

  // Timing
  delta: 0,
  clock: null,
};
