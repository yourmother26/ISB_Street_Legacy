import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_BASE = new URL('../New%20Folder%201/Models/GLB%20format/', import.meta.url).href;
const CHUNK_X = 96;
const CHUNK_Z = 96;
const BASE_LOAD_RADIUS = 1;
const WORLD_LIMIT = 4900;

export async function initEngine(canvas, { onStats = () => {} } = {}) {
  if (!canvas) throw new Error('Game canvas was not found.');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8cce8);
  scene.fog = new THREE.Fog(0xa8cce8, 320, 1450);
  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1800);
  camera.position.set(0, 2.2, 14);

  scene.add(new THREE.HemisphereLight(0xd7edff, 0x69735d, 2.0));
  const sun = new THREE.DirectionalLight(0xffedcf, 2.1);
  sun.position.set(-55, 90, 38);
  scene.add(sun);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x697c58, roughness: 1 });
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x292e34, roughness: 1 });
  const asphaltAltMat = new THREE.MeshStandardMaterial({ color: 0x33373c, roughness: 1 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xb9b8ad, roughness: 1 });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x858984, roughness: 1 });
  const whitePaint = new THREE.MeshBasicMaterial({ color: 0xf4f1e6 });
  const yellowPaint = new THREE.MeshBasicMaterial({ color: 0xf1c64c });
  const bluePaint = new THREE.MeshBasicMaterial({ color: 0x58a8e8 });
  const grassMats = [0x657d50, 0x748b59, 0x536d43, 0x899365].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  const fenceMats = [0x5b5142, 0x8b8c83, 0x4b5659, 0x9c805a].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  const houseMats = [0xf0bd65, 0xe5e0d2, 0xd96f5e, 0x70a6c4, 0x91b978, 0xc8a2ce, 0xe7d66f, 0xd8e5e8, 0xc17f50].map(color => new THREE.MeshStandardMaterial({ color, roughness: .9 }));
  const concreteMats = [0xd7c7a9, 0xb9c3c9, 0xc4b3a2, 0x9da9a8, 0xe0d9cb].map(color => new THREE.MeshStandardMaterial({ color, roughness: .95 }));
  const roofMats = [0x873f35, 0x4b5056, 0x8a6c47, 0x315c68].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x8fd8f2, emissive: 0x17394b, roughness: .35, metalness: .1 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x593b2a, roughness: .9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b422b, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7946, roughness: 1 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x343c44, roughness: .8, metalness: .25 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe8a1, emissive: 0xffd16a, emissiveIntensity: 1.1 });
  const signalHousingMat = new THREE.MeshStandardMaterial({ color: 0x20252b, roughness: .55, metalness: .15 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0x5b1515, emissive: 0x000000 });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0x5a4310, emissive: 0x000000 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x164a2a, emissive: 0x000000 });
  const treeGeo = new THREE.SphereGeometry(1, 8, 6);
  const roofGeo = new THREE.ConeGeometry(1, 1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.14;
  ground.frustumCulled = false;
  scene.add(ground);

  function addBox(parent, name, material, x, y, z, w, h, d) {
    const mesh = new THREE.Mesh(boxGeo, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function addPlane(parent, material, x, z, w, d, y = .01) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function seededRandom(x, z, salt = 0) {
    let state = (Math.imul(x + 12031 + salt * 17, 374761393) ^ Math.imul(z + 9049 - salt * 31, 668265263)) >>> 0;
    return () => {
      state = (Math.imul(state ^ (state >>> 13), 1274126177)) >>> 0;
      state = (state ^ (state >>> 16)) >>> 0;
      return state / 4294967296;
    };
  }
  const positiveMod = (n, m) => ((n % m) + m) % m;
  const loader = new GLTFLoader();
  loader.setPath(ASSET_BASE);
  loader.setResourcePath(ASSET_BASE);
  const modelCache = new Map();
  const regularNames = Array.from({ length: 14 }, (_, i) => 'building-' + String.fromCharCode(97 + i) + '.glb');
  const towerNames = Array.from({ length: 5 }, (_, i) => 'building-skyscraper-' + String.fromCharCode(97 + i) + '.glb');
  const lowNames = Array.from({ length: 14 }, (_, i) => 'low-detail-building-' + String.fromCharCode(97 + i) + '.glb');
  const wideLowNames = ['low-detail-building-wide-a.glb', 'low-detail-building-wide-b.glb'];
  const detailNames = ['detail-awning.glb', 'detail-awning-wide.glb', 'detail-overhang.glb', 'detail-overhang-wide.glb', 'detail-parasol-a.glb', 'detail-parasol-b.glb'];

  function loadModel(name) {
    if (!modelCache.has(name)) {
      const promise = loader.loadAsync(name).then(gltf => {
        const root = gltf.scene;
        root.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(root);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        if (!(size.x > 0 && size.y > 0 && size.z > 0)) throw new Error('Empty GLB model: ' + name);
        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= bounds.min.y;
        root.traverse(obj => {
          if (!obj.isMesh) return;
          obj.userData.sharedModelGeometry = true;
          obj.castShadow = false;
          obj.receiveShadow = true;
          const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
          for (const mat of mats) {
            if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
            mat.needsUpdate = true;
          }
        });
        root.userData.sourceSize = size;
        return root;
      }).catch(error => { modelCache.delete(name); throw error; });
      modelCache.set(name, promise);
    }
    return modelCache.get(name);
  }

  function fitModel(template, x, z, targetW, targetD, maxH, yaw = 0) {
    const model = template.clone(true);
    const size = template.userData.sourceSize;
    const scale = Math.min(targetW / size.x, targetD / size.z, maxH / size.y);
    model.scale.setScalar(scale);
    model.position.set(x, 0, z);
    model.rotation.y = yaw;
    return model;
  }

  function addFallbackBuilding(parent, x, z, rand, w, d, h, isTower = false) {
    const mat = isTower ? concreteMats[Math.floor(rand() * concreteMats.length)] : houseMats[Math.floor(rand() * houseMats.length)];
    addBox(parent, 'fallback building', mat, x, h / 2, z, w, h, d);
    addBox(parent, 'fallback entrance', doorMat, x, .95, z + d / 2 + .05, .8, 1.9, .1);
    const floors = Math.max(1, Math.floor(h / 3));
    for (let f = 0; f < Math.min(floors, 9); f++) {
      for (let col = -1; col <= 1; col++) {
        addBox(parent, 'fallback window', windowMat, x + col * Math.min(w * .27, 2.5), 2.1 + f * 2.8, z + d / 2 + .06, .8, .85, .08);
      }
    }
    if (!isTower) {
      const roof = new THREE.Mesh(roofGeo, roofMats[Math.floor(rand() * roofMats.length)]);
      roof.scale.set(w * .72, 2.2, d * .72);
      roof.position.set(x, h + 1, z);
      parent.add(roof);
    }
  }

  // Roads are selected by shared edge IDs: adjoining chunks always agree on road presence and width.
  function horizontalRoad(cz) {
    const r = seededRandom(0, cz, 71)();
    return positiveMod(cz, 4) === 0 || r > .24;
  }
  function verticalRoad(cx) {
    const r = seededRandom(cx, 0, 93)();
    return positiveMod(cx, 4) === 0 || r > .30;
  }
  function horizontalWidth(cz) {
    return positiveMod(cz, 4) === 0 ? 25 : (positiveMod(cz, 5) === 0 ? 19 : 13 + Math.floor(seededRandom(0, cz, 21)() * 3));
  }
  function verticalWidth(cx) {
    return positiveMod(cx, 4) === 0 ? 26 : (positiveMod(cx, 6) === 0 ? 20 : 13 + Math.floor(seededRandom(cx, 0, 27)() * 3));
  }

  const chunks = new Map();
  const trafficSignals = [];
  const clock = new THREE.Clock();
  function addTrafficSignal(parent, x, z, facing, rand) {
    const poleHeight = 5.2;
    addBox(parent, 'traffic signal pole', poleMat, x, poleHeight / 2, z, .19, poleHeight, .19);
    const headX = x + Math.cos(facing) * .62;
    const headZ = z + Math.sin(facing) * .62;
    addBox(parent, 'traffic signal housing', signalHousingMat, headX, 4.35, headZ, .48, 1.35, .36);
    const bulbs = [];
    const ys = [4.72, 4.35, 3.98];
    for (let i = 0; i < 3; i++) {
      const geo = new THREE.SphereGeometry(.13, 8, 6);
      const bulb = new THREE.Mesh(geo, [redMat, amberMat, greenMat][i]);
      bulb.position.set(headX, ys[i], headZ + .2);
      parent.add(bulb);
      bulbs.push(bulb);
    }
    trafficSignals.push({ bulbs, phaseOffset: rand() * 8 });
  }

  function addStreetLight(parent, x, z, alongX, rand) {
    const height = 6.3 + rand() * 1.4;
    addBox(parent, 'sidewalk streetlight pole', poleMat, x, height / 2, z, .16, height, .16);
    if (alongX) {
      addBox(parent, 'streetlight arm', poleMat, x + 1.05, height - .28, z, 1.9, .13, .13);
      const bulb = addBox(parent, 'streetlight lamp', lampMat, x + 1.85, height - .22, z, .46, .14, .3);
      bulb.material = lampMat;
    } else {
      addBox(parent, 'streetlight arm', poleMat, x, height - .28, z + 1.05, .13, .13, 1.9);
      addBox(parent, 'streetlight lamp', lampMat, x, height - .22, z + 1.85, .3, .14, .46);
    }
  }

  function addRoadSegment(group, orientation, centerX, centerZ, length, width, rand, style) {
    const mat = style === 'boulevard' ? asphaltAltMat : asphaltMat;
    if (orientation === 'x') {
      addPlane(group, mat, centerX, centerZ, length, width, -.02);
      for (const side of [-1, 1]) {
        addBox(group, 'road curb', curbMat, centerX, .06, centerZ + side * (width / 2 + .28), length, .12, .56);
        addPlane(group, sidewalkMat, centerX, centerZ + side * (width / 2 + 1.65), length, 2.25, .005);
        addPlane(group, whitePaint, centerX, centerZ + side * (width / 2 - .65), length, .13, .015);
      }
      // Broken lane dividers, plus double-yellow centre line on local roads.
      const dash = style === 'boulevard' ? 5.5 : 3.4;
      const gap = style === 'boulevard' ? 5.5 : 4.5;
      for (let x = centerX - length / 2 + 5; x < centerX + length / 2 - 2; x += dash + gap) {
        addPlane(group, style === 'boulevard' ? whitePaint : yellowPaint, x + dash / 2, centerZ, dash, .13, .018);
      }
      if (width > 18) {
        addPlane(group, yellowPaint, centerX, centerZ - .16, length, .1, .02);
        addPlane(group, yellowPaint, centerX, centerZ + .16, length, .1, .02);
        // Additional lane dividers on the wider roads.
        addPlane(group, whitePaint, centerX, centerZ - width * .24, length, .11, .019);
        addPlane(group, whitePaint, centerX, centerZ + width * .24, length, .11, .019);
      }
      // Kerbside street furniture stays on the pavement, never in traffic lanes.
      for (const frac of [-.32, .30]) {
        const lx = centerX + frac * length;
        addStreetLight(group, lx, centerZ + width / 2 + 2.6, true, rand);
      }
    } else {
      addPlane(group, mat, centerX, centerZ, width, length, -.019);
      for (const side of [-1, 1]) {
        addBox(group, 'road curb', curbMat, centerX + side * (width / 2 + .28), .06, centerZ, .56, .12, length);
        addPlane(group, sidewalkMat, centerX + side * (width / 2 + 1.65), centerZ, 2.25, length, .006);
        addPlane(group, whitePaint, centerX + side * (width / 2 - .65), centerZ, .13, length, .016);
      }
      const dash = style === 'boulevard' ? 5.5 : 3.4;
      const gap = style === 'boulevard' ? 5.5 : 4.5;
      for (let z = centerZ - length / 2 + 5; z < centerZ + length / 2 - 2; z += dash + gap) {
        addPlane(group, style === 'boulevard' ? whitePaint : yellowPaint, centerX, z + dash / 2, .13, dash, .019);
      }
      if (width > 18) {
        addPlane(group, yellowPaint, centerX - .16, centerZ, .1, length, .02);
        addPlane(group, yellowPaint, centerX + .16, centerZ, .1, length, .02);
        addPlane(group, whitePaint, centerX - width * .24, centerZ, .11, length, .019);
        addPlane(group, whitePaint, centerX + width * .24, centerZ, .11, length, .019);
      }
      for (const frac of [-.32, .30]) {
        const lz = centerZ + frac * length;
        addStreetLight(group, centerX + width / 2 + 2.6, lz, false, rand);
      }
    }
  }

  function addCrosswalk(group, x, z, widthX, widthZ) {
    for (let i = -4; i <= 4; i++) {
      addPlane(group, whitePaint, x + i * 1.05, z - widthZ * .18, .64, Math.min(4.6, widthZ * .38), .03);
      addPlane(group, whitePaint, x - widthX * .18, z + i * 1.05, Math.min(4.6, widthX * .38), .64, .031);
    }
    // Stop lines sit just before the crosswalks.
    addPlane(group, whitePaint, x, z - widthZ * .43, widthX * .78, .22, .032);
    addPlane(group, whitePaint, x - widthX * .43, z, .22, widthZ * .78, .033);
  }

  function addProperty(parent, x, z, size, rand, style) {
    const half = size / 2;
    const grass = grassMats[Math.floor(rand() * grassMats.length)];
    addPlane(parent, grass, x, z, size - 1.4, size - 1.4, -.006);
    const fenceMat = fenceMats[Math.floor(rand() * fenceMats.length)];
    const fenceH = .8 + rand() * .45;
    const fenceD = .12;
    // Front gate opening is randomized so every property doesn't have the same outline.
    const gateSide = Math.floor(rand() * 4);
    for (let side = 0; side < 4; side++) {
      if (side === gateSide) {
        const segment = (size - 4) / 2;
        if (side === 0 || side === 2) {
          addBox(parent, 'yard fence', fenceMat, x - size / 4 - 1, fenceH / 2, z + (side === 0 ? -half : half), segment, fenceH, fenceD);
          addBox(parent, 'yard fence', fenceMat, x + size / 4 + 1, fenceH / 2, z + (side === 0 ? -half : half), segment, fenceH, fenceD);
        } else {
          addBox(parent, 'yard fence', fenceMat, x + (side === 1 ? half : -half), fenceH / 2, z - size / 4 - 1, fenceD, fenceH, segment);
          addBox(parent, 'yard fence', fenceMat, x + (side === 1 ? half : -half), fenceH / 2, z + size / 4 + 1, fenceD, fenceH, segment);
        }
      } else if (side === 0 || side === 2) {
        addBox(parent, 'yard fence', fenceMat, x, fenceH / 2, z + (side === 0 ? -half : half), size, fenceH, fenceD);
      } else {
        addBox(parent, 'yard fence', fenceMat, x + (side === 1 ? half : -half), fenceH / 2, z, fenceD, fenceH, size);
      }
    }
    // Walkway and driveway, each with its own width and offset.
    if (style === 'suburban' || style === 'mixed') {
      const drivewayW = 2.6 + rand() * 2.2;
      addPlane(parent, curbMat, x + (rand() - .5) * 5, z + half * .53, drivewayW, size * .32, .012);
      addPlane(parent, sidewalkMat, x + (rand() - .5) * 4, z + half * .22, 1.15, size * .24, .016);
    }
    // Unequal trees, hedges and planters break the identical-yard look.
    const trees = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < trees; i++) {
      const tx = x + (rand() - .5) * (size - 7);
      const tz = z + (rand() - .5) * (size - 7);
      const trunkH = 1.8 + rand() * 1.8;
      addBox(parent, 'yard tree trunk', trunkMat, tx, trunkH / 2, tz, .25 + rand() * .18, trunkH, .25 + rand() * .18);
      const leaves = new THREE.Mesh(treeGeo, leafMat);
      leaves.position.set(tx, trunkH + 1.1, tz);
      leaves.scale.set(.9 + rand() * .7, 1.0 + rand() * .8, .9 + rand() * .7);
      parent.add(leaves);
    }
    if (rand() > .35) {
      const planterX = x + (rand() - .5) * size * .6;
      const planterZ = z + (rand() - .5) * size * .6;
      addBox(parent, 'garden planter', concreteMats[Math.floor(rand() * concreteMats.length)], planterX, .22, planterZ, 1.5 + rand(), .44, 1.1 + rand());
    }
  }

  function createChunk(cx, cz, nearCenter) {
    const key = cx + ',' + cz;
    const group = new THREE.Group();
    group.name = 'streamed-city-chunk-' + key;
    group.userData.chunkKey = key;
    scene.add(group);
    const rand = seededRandom(cx, cz, 7);
    const x0 = cx * CHUNK_X;
    const z0 = cz * CHUNK_Z;
    const midX = x0 + CHUNK_X / 2;
    const midZ = z0 + CHUNK_Z / 2;
    const chunk = { key, cx, cz, group, pending: true };
    chunks.set(key, chunk);

    const hasNorthRoad = horizontalRoad(cz);
    const hasSouthRoad = horizontalRoad(cz + 1);
    const hasWestRoad = verticalRoad(cx);
    const hasEastRoad = verticalRoad(cx + 1);
    const northWidth = horizontalWidth(cz);
    const southWidth = horizontalWidth(cz + 1);
    const westWidth = verticalWidth(cx);
    const eastWidth = verticalWidth(cx + 1);
    const roadWidths = [northWidth, southWidth, westWidth, eastWidth];
    const arterial = roadWidths.some(w => w >= 24);
    const style = arterial ? 'boulevard' : 'local';

    if (hasNorthRoad) addRoadSegment(group, 'x', midX, z0, CHUNK_X, northWidth, rand, northWidth >= 24 ? 'boulevard' : style);
    if (hasSouthRoad) addRoadSegment(group, 'x', midX, z0 + CHUNK_Z, CHUNK_X, southWidth, rand, southWidth >= 24 ? 'boulevard' : style);
    if (hasWestRoad) addRoadSegment(group, 'z', x0, midZ, CHUNK_Z, westWidth, rand, westWidth >= 24 ? 'boulevard' : style);
    if (hasEastRoad) addRoadSegment(group, 'z', x0 + CHUNK_X, midZ, CHUNK_Z, eastWidth, rand, eastWidth >= 24 ? 'boulevard' : style);

    // Intersection geometry only appears where both road axes really meet.
    if (hasNorthRoad && hasWestRoad) {
      const ix = x0, iz = z0;
      const ww = Math.max(northWidth, westWidth);
      const ew = Math.max(southWidth, eastWidth);
      addPlane(group, asphaltAltMat, ix, iz, Math.max(northWidth, southWidth) + 1.4, Math.max(westWidth, eastWidth) + 1.4, -.008);
      addCrosswalk(group, ix, iz, Math.max(northWidth, southWidth), Math.max(westWidth, eastWidth));
      const offsetX = westWidth / 2 + 2.5;
      const offsetZ = northWidth / 2 + 2.5;
      addTrafficSignal(group, ix - offsetX, iz - offsetZ, 0, rand);
      addTrafficSignal(group, ix + offsetX, iz + offsetZ, Math.PI, rand);
      // Corner islands on some major junctions.
      if (northWidth >= 24 && westWidth >= 24) {
        addPlane(group, grassMats[1], ix + 10, iz + 10, 4.2, 4.2, .018);
        addBox(group, 'median bollard', poleMat, ix + 10, .55, iz + 10, .32, 1.1, .32);
      }
    }

    // A few distinctive road details per block: parking bays, turn pockets, lane arrows and bus stops.
    if (hasNorthRoad && positiveMod(cx * 3 + cz, 5) === 0) {
      const bayZ = z0 + northWidth / 2 + 5;
      addPlane(group, asphaltAltMat, midX, bayZ, 18, 5, -.002);
      for (let i = -2; i <= 2; i++) addPlane(group, whitePaint, midX + i * 3.2, bayZ, .12, 4.3, .022);
      addBox(group, 'bus stop shelter post', poleMat, midX - 4, 1.25, bayZ + 1, .12, 2.5, .12);
      addBox(group, 'bus stop shelter post', poleMat, midX + 4, 1.25, bayZ + 1, .12, 2.5, .12);
      addBox(group, 'bus stop roof', signalHousingMat, midX, 2.55, bayZ + 1, 8.5, .18, 2.4);
      addBox(group, 'bus stop bench', fenceMats[0], midX, .55, bayZ + 1.6, 4.5, .15, .55);
    }
    if (hasWestRoad && positiveMod(cx + cz * 2, 4) === 0) {
      const signX = x0 + westWidth / 2 + 5;
      addBox(group, 'road direction sign pole', poleMat, signX, 2.1, midZ, .14, 4.2, .14);
      addBox(group, 'road direction sign board', bluePaint, signX, 3.55, midZ, 1.7, .85, .12);
    }

    // District identity changes block density, building height and the property layout.
    const districtRoll = seededRandom(Math.floor(cx / 2), Math.floor(cz / 2), 111)();
    const downtown = Math.abs(cx) + Math.abs(cz) < 5 || districtRoll < .12;
    const commercial = !downtown && districtRoll < .34;
    const industrial = !downtown && !commercial && districtRoll < .48;
    const suburban = !downtown && !commercial && !industrial;
    const district = downtown ? 'downtown' : commercial ? 'commercial' : industrial ? 'industrial' : 'suburban';
    const lotSize = downtown ? 20 : industrial ? 21 : 19;
    const centers = [26, 48, 70];
    const lotJobs = [];
    let serial = positiveMod(cx * 11 + cz * 17, regularNames.length);
    for (let rz = 0; rz < 3; rz++) {
      for (let rx = 0; rx < 3; rx++) {
        const lotRand = seededRandom(cx * 7 + rx, cz * 11 + rz, 301);
        const roll = lotRand();
        if (suburban && roll < .18) continue;
        if (commercial && roll < .1) continue;
        if (downtown && roll < .05) continue;
        if (industrial && roll < .36) continue;
        const x = x0 + centers[rx] + (lotRand() - .5) * 5.5;
        const z = z0 + centers[rz] + (lotRand() - .5) * 5.5;
        let name;
        let tower = false;
        if (downtown && lotRand() < .62) {
          name = towerNames[positiveMod(serial + rx * 2 + rz * 3 + Math.floor(lotRand() * 5), towerNames.length)];
          tower = true;
        } else if (!nearCenter) {
          name = lowNames[positiveMod(serial + rx * 3 + rz * 5, lowNames.length)];
        } else {
          name = regularNames[positiveMod(serial + rx * 3 + rz * 5, regularNames.length)];
        }
        serial += 3 + Math.floor(lotRand() * 4);
        const mainW = tower ? 15 + lotRand() * 6 : industrial ? 13 + lotRand() * 5 : commercial ? 9 + lotRand() * 6 : 8 + lotRand() * 5;
        const mainD = tower ? 15 + lotRand() * 6 : industrial ? 13 + lotRand() * 5 : commercial ? 9 + lotRand() * 6 : 8 + lotRand() * 5;
        const mainH = tower ? 105 + lotRand() * 85 : commercial ? 24 + lotRand() * 25 : suburban ? 8 + lotRand() * 11 : 25 + lotRand() * 15;
        lotJobs.push({ x, z, name, tower, mainW, mainD, mainH, yaw: Math.floor(lotRand() * 4) * Math.PI / 2, lotRand, rx, rz });
      }
    }

    // Vary property boundaries and setbacks so yards don't all share the same silhouette.
    for (const job of lotJobs) {
      if (job.tower) continue;
      const propertySize = (suburban ? 16 : 15) + job.lotRand() * 4;
      if (suburban || job.lotRand() > .4) addProperty(group, job.x, job.z, propertySize, job.lotRand, district);
      // Main structure.
      const secondaryOffsetX = (job.lotRand() - .5) * 5;
      const secondaryOffsetZ = (job.lotRand() - .5) * 5;
      const hasAnnex = job.lotRand() > (suburban ? .38 : .62);
      job.annex = hasAnnex ? {
        name: nearCenter ? regularNames[positiveMod(serial + job.rx * 5 + job.rz * 7, regularNames.length)] : lowNames[positiveMod(serial + job.rx * 5 + job.rz * 7, lowNames.length)],
        x: job.x + (job.mainW * .55) * (job.lotRand() > .5 ? 1 : -1) + secondaryOffsetX,
        z: job.z + (job.mainD * .5) * (job.lotRand() > .5 ? 1 : -1) + secondaryOffsetZ,
        w: 5 + job.lotRand() * 5, d: 5 + job.lotRand() * 5, h: 4 + job.lotRand() * 7,
        yaw: Math.floor(job.lotRand() * 4) * Math.PI / 2
      } : null;
    }

    // Populate with multiple unique buildings, varied scale and non-identical yard clusters.
    const modelJobs = [];
    for (const job of lotJobs) {
      modelJobs.push({ name: job.name, x: job.x, z: job.z, w: job.mainW, d: job.mainD, h: job.mainH, yaw: job.yaw, tower: job.tower });
      if (job.annex && !job.tower) modelJobs.push({ ...job.annex, tower: false });
      // Small shop extensions and rooftop/canopy details are limited to relevant districts.
      if ((commercial || downtown) && !job.tower && job.lotRand() > .45) {
        const detailName = detailNames[positiveMod(job.rx * 5 + job.rz * 3 + cx - cz, detailNames.length)];
        loadModel(detailName).then(template => {
          if (chunks.get(key) !== chunk) return;
          const detail = fitModel(template, job.x, job.z + job.mainD / 2 + 1.5, 4 + job.lotRand() * 2, 3, 4, job.yaw);
          detail.name = detailName;
          group.add(detail);
        }).catch(() => {});
      }
    }

    // More street trees and planters on residential blocks; landscaped medians on boulevards.
    if (suburban || commercial) {
      for (let i = 0; i < 5; i++) {
        const tx = x0 + 12 + rand() * 72;
        const tz = z0 + 12 + rand() * 72;
        const trunkH = 2 + rand() * 2.2;
        addBox(group, 'public tree trunk', trunkMat, tx, trunkH / 2, tz, .3, trunkH, .3);
        const leaves = new THREE.Mesh(treeGeo, leafMat);
        leaves.position.set(tx, trunkH + 1.2, tz);
        leaves.scale.set(1.2 + rand(), 1.2 + rand(), 1.2 + rand());
        group.add(leaves);
      }
    }
    if (roadWidths.some(w => w >= 24) && positiveMod(cx + cz, 3) === 0) {
      const isHorizontal = northWidth >= westWidth;
      if (isHorizontal && hasNorthRoad) {
        addPlane(group, grassMats[2], midX, z0 + northWidth / 2 + 1.2, 34, 1.2, .025);
        for (let i = -3; i <= 3; i++) addBox(group, 'median bollard', poleMat, midX + i * 4.5, .45, z0 + northWidth / 2 + 1.2, .2, .9, .2);
      }
    }

    Promise.all(modelJobs.map(async job => {
      try {
        const template = await loadModel(job.name);
        if (chunks.get(key) !== chunk) return;
        const model = fitModel(template, job.x, job.z, job.w, job.d, job.h, job.yaw);
        model.name = job.name;
        group.add(model);
      } catch (error) {
        console.warn('[ISB Street Legacy] Could not load ' + job.name, error);
        if (chunks.get(key) !== chunk) return;
        addFallbackBuilding(group, job.x, job.z, rand, job.w, job.d, Math.min(job.h, job.tower ? 45 : 18), job.tower);
      }
    }));
    chunk.pending = false;
    return chunk;
  }

  let lastChunkX = NaN, lastChunkZ = NaN, lastRadius = -1;
  function updateStreaming(force = false) {
    const radius = Math.min(3, BASE_LOAD_RADIUS + Math.floor(Math.max(0, camera.position.y - 25) / 65));
    const centerX = Math.floor(camera.position.x / CHUNK_X);
    const centerZ = Math.floor(camera.position.z / CHUNK_Z);
    if (!force && centerX === lastChunkX && centerZ === lastChunkZ && radius === lastRadius) return;
    lastChunkX = centerX;
    lastChunkZ = centerZ;
    lastRadius = radius;
    const wanted = new Set();
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const cx = centerX + dx, cz = centerZ + dz;
        if (Math.abs(cx * CHUNK_X) > WORLD_LIMIT || Math.abs(cz * CHUNK_Z) > WORLD_LIMIT) continue;
        const key = cx + ',' + cz;
        wanted.add(key);
        if (!chunks.has(key)) createChunk(cx, cz, Math.max(Math.abs(dx), Math.abs(dz)) <= 1);
      }
    }
    for (const [key, chunk] of chunks) {
      if (wanted.has(key)) continue;
      scene.remove(chunk.group);
      chunk.group.traverse(obj => {
        if (obj.isMesh && obj.geometry !== boxGeo && obj.geometry !== treeGeo && obj.geometry !== roofGeo && !obj.userData.sharedModelGeometry) {
          obj.geometry?.dispose();
        }
      });
      chunks.delete(key);
    }
  }
  updateStreaming(true);

  // Functional signal phases: conflicting approaches alternate between green directions.
  let signalElapsed = 0;
  function updateTrafficSignals(dt) {
    signalElapsed += dt;
    for (const signal of trafficSignals) {
      const phase = (signalElapsed + signal.phaseOffset) % 16;
      let active = phase < 7 ? 2 : phase < 8 ? 1 : phase < 15 ? 0 : 1;
      signal.bulbs.forEach((bulb, i) => {
        const on = i === active;
        const mat = [redMat, amberMat, greenMat][i];
        mat.emissive.setHex(on ? [0xff1818, 0xffad18, 0x20ff62][i] : 0x000000);
        mat.emissiveIntensity = on ? 2.4 : 0;
        bulb.scale.setScalar(on ? 1.18 : 1);
      });
    }
  }

  let yaw = 0, pitch = -.06, dragging = false, lastX = 0, lastY = 0;
  let moveX = 0, moveY = 0, paused = false, verticalInput = 0;
  const keys = new Set();
  const onKeyDown = e => {
    if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift','Control','q','e'].includes(e.key)) {
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
      keys.add(e.key.toLowerCase());
    }
  };
  const onKeyUp = e => keys.delete(e.key.toLowerCase());
  const onPointerDown = e => {
    if (paused || e.clientX < window.innerWidth * .42) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = e => {
    if (!dragging || paused) return;
    yaw -= (e.clientX - lastX) * .0042;
    pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lastY) * .0032, -1.45, 1.35);
    lastX = e.clientX; lastY = e.clientY;
  };
  const onPointerUp = () => { dragging = false; };
  const onWheel = e => { camera.position.y = THREE.MathUtils.clamp(camera.position.y + e.deltaY * .035, 1.4, 220); updateStreaming(); };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  const onBlur = () => { keys.clear(); moveX = 0; moveY = 0; verticalInput = 0; dragging = false; };
  window.addEventListener('blur', onBlur);

  let lastTime = performance.now(), sampleStart = lastTime, frames = 0, running = true;
  function resize() {
    const viewport = window.visualViewport;
    const w = Math.max(1, Math.round(viewport?.width || window.innerWidth));
    const h = Math.max(1, Math.round(viewport?.height || window.innerHeight));
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.1));
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });

  function animate(now) {
    if (!running) return;
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, .05);
    lastTime = now; frames++;
    if (now - sampleStart >= 600) {
      onStats({ fps: Math.round(frames * 1000 / (now - sampleStart)), frameMs: Math.round((now - sampleStart) / Math.max(frames, 1) * 10) / 10, renderer: 'WebGL · redesigned streamed city' });
      frames = 0; sampleStart = now;
    }
    if (!paused) {
      let forward = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - moveY;
      let strafe = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + moveX;
      const length = Math.hypot(forward, strafe);
      if (length > 1) { forward /= length; strafe /= length; }
      const speed = (keys.has('shift') ? 30 : 13) * dt;
      camera.position.x = THREE.MathUtils.clamp(camera.position.x + (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed, -WORLD_LIMIT, WORLD_LIMIT);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) * speed, -WORLD_LIMIT, WORLD_LIMIT);
      const ascend = keys.has(' ') || keys.has('e') || verticalInput > 0;
      const descend = keys.has('control') || keys.has('q') || verticalInput < 0;
      if (ascend !== descend) camera.position.y += (ascend ? 1 : -1) * (keys.has('shift') ? 48 : 24) * dt;
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.4, 220);
      updateStreaming();
      updateTrafficSignals(dt);
    } else {
      updateTrafficSignals(dt);
    }
    const lookDir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(camera.position.clone().add(lookDir));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  return {
    renderer, scene, camera,
    setMoveInput(x, y) { moveX = THREE.MathUtils.clamp(x, -1, 1); moveY = THREE.MathUtils.clamp(y, -1, 1); },
    setVerticalInput(value) { verticalInput = THREE.MathUtils.clamp(value, -1, 1); },
    setPaused(value) { paused = Boolean(value); if (paused) { keys.clear(); moveX = 0; moveY = 0; verticalInput = 0; dragging = false; } },
    setQuality(level) {
      const ratio = level === 'high' ? 1.2 : level === 'low' ? .7 : 1;
      renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * ratio, 1.1));
      resize();
    },
    dispose() {
      running = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      for (const chunk of chunks.values()) scene.remove(chunk.group);
      chunks.clear();
      renderer.dispose();
    }
  };
}
