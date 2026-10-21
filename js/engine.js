import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_BASE = new URL('../New%20Folder%201/Models/GLB%20format/', import.meta.url).href;
const CHUNK_X = 42;
const CHUNK_Z = 48;
const BASE_LOAD_RADIUS = 2; // Expand the loaded view when flying high.
const WORLD_LIMIT = 4900;

export async function initEngine(canvas, { onStats = () => {} } = {}) {
  if (!canvas) throw new Error('Game canvas was not found.');
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: false, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.15));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fc8e8);
  scene.fog = new THREE.Fog(0x9fc8e8, 260, 1250);
  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1600);
  camera.position.set(0, 2.2, 14);

  scene.add(new THREE.HemisphereLight(0xd7edff, 0x69735d, 2.1));
  const sun = new THREE.DirectionalLight(0xffedcf, 2.0);
  sun.position.set(-35, 65, 28);
  scene.add(sun);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x657a55, roughness: 1 });
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x25292e, roughness: 1 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xb9b8ad, roughness: 1 });
  const whitePaint = new THREE.MeshBasicMaterial({ color: 0xf3f1e8 });
  const yellowPaint = new THREE.MeshBasicMaterial({ color: 0xf0c84a });
  const concreteMats = [0xd7c7a9, 0xb9c3c9, 0xc4b3a2, 0x9da9a8, 0xe0d9cb]
    .map(color => new THREE.MeshStandardMaterial({ color, roughness: .95 }));
  const houseMats = [0xf0bd65, 0xe5e0d2, 0xd96f5e, 0x70a6c4, 0x91b978, 0xc8a2ce, 0xe7d66f, 0xd8e5e8, 0xc17f50]
    .map(color => new THREE.MeshStandardMaterial({ color, roughness: .9 }));
  const roofMats = [0x873f35, 0x4b5056, 0x8a6c47, 0x315c68]
    .map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x8fd8f2, emissive: 0x17394b, roughness: .35, metalness: .1 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x593b2a, roughness: .9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b422b, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7946, roughness: 1 });
  const treeGeo = new THREE.SphereGeometry(1, 7, 5);
  const roofGeo = new THREE.ConeGeometry(1, 1, 4);
  roofGeo.rotateY(Math.PI / 4);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a4249, roughness: .8 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffefc1 });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.13;
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

  // GLB templates are loaded on demand and shared by every instance.
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
        // Normalize the source pivot so each asset sits neatly on its lot.
        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= bounds.min.y;
        root.traverse(obj => {
          if (obj.isMesh) {
            obj.userData.sharedModelGeometry = true;
            obj.castShadow = false;
            obj.receiveShadow = true;
            if (obj.material) {
              const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
              for (const material of materials) {
                if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
                material.needsUpdate = true;
              }
            }
          }
        });
        root.userData.sourceSize = size;
        return root;
      }).catch(error => {
        modelCache.delete(name);
        throw error;
      });
      modelCache.set(name, promise);
    }
    return modelCache.get(name);
  }

  function seededRandom(x, z) {
    let state = (Math.imul(x + 12031, 374761393) ^ Math.imul(z + 9049, 668265263)) >>> 0;
    return () => {
      state = (Math.imul(state ^ (state >>> 13), 1274126177)) >>> 0;
      state = (state ^ (state >>> 16)) >>> 0;
      return state / 4294967296;
    };
  }
  const positiveMod = (n, m) => ((n % m) + m) % m;

  function addBuildingFallback(parent, x, z, rand, isTower) {
    const w = isTower ? 11 + rand() * 4 : 7 + rand() * 4;
    const d = isTower ? 11 + rand() * 4 : 8 + rand() * 4;
    const h = isTower ? 28 + rand() * 26 : 5 + rand() * 8;
    addBox(parent, 'temporary building fallback', isTower ? concreteMats[Math.floor(rand() * concreteMats.length)] : houseMats[Math.floor(rand() * houseMats.length)], x, h / 2, z, w, h, d);
    addBox(parent, 'fallback front door', doorMat, x, 1, z + d / 2 + .04, .85, 1.9, .08);
    if (!isTower) {
      addBox(parent, 'fallback window', windowMat, x - 1.5, 2.3, z + d / 2 + .06, 1.05, .85, .08);
      addBox(parent, 'fallback window', windowMat, x + 1.5, 2.3, z + d / 2 + .06, 1.05, .85, .08);
      const roof = new THREE.Mesh(roofGeo, roofMats[Math.floor(rand() * roofMats.length)]);
      roof.scale.set(w * .72, 2.2, d * .72);
      roof.position.set(x, h + 1, z);
      parent.add(roof);
    }
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

  function createChunk(cx, cz, nearCenter) {
    const key = cx + ',' + cz;
    const group = new THREE.Group();
    group.name = 'streamed-city-chunk-' + key;
    group.userData.chunkKey = key;
    scene.add(group);
    const rand = seededRandom(cx, cz);
    const x0 = cx * CHUNK_X;
    const z0 = cz * CHUNK_Z;
    const midX = x0 + CHUNK_X / 2;
    const midZ = z0 + CHUNK_Z / 2;
    const chunk = { key, cx, cz, group, pending: true };
    chunks.set(key, chunk);

    // Every chunk owns its road segments. Neighboring chunks continue the grid seamlessly.
    addPlane(group, asphaltMat, x0, midZ, 13, CHUNK_Z, -.015);
    addPlane(group, asphaltMat, midX, z0, CHUNK_X, 13, -.014);
    for (const side of [-1, 1]) {
      addBox(group, 'road kerb', sidewalkMat, x0 + side * 7.05, .055, midZ, .34, .11, CHUNK_Z);
      addBox(group, 'road edge line', whitePaint, x0 + side * 5.95, .012, midZ, .12, .02, CHUNK_Z);
      addBox(group, 'road kerb', sidewalkMat, midX, .055, z0 + side * 7.05, CHUNK_X, .11, .34);
      addBox(group, 'road edge line', whitePaint, midX, .012, z0 + side * 5.95, CHUNK_X, .02, .12);
    }
    for (let z = z0 + 7; z < z0 + CHUNK_Z - 2; z += 12) addPlane(group, yellowPaint, x0, z, .17, 5.0, .019);
    for (let x = x0 + 7; x < x0 + CHUNK_X - 2; x += 12) addPlane(group, yellowPaint, x, z0, 5.0, .17, .02);

    // Small crosswalks at selected intersections, not at every single block.
    if (positiveMod(cx, 3) === 0 && positiveMod(cz, 2) === 0) {
      for (let i = -3; i <= 3; i++) {
        addPlane(group, whitePaint, x0 + i * 1.1, z0 + 7.7, .68, 2.1, .024);
        addPlane(group, whitePaint, x0 + 7.7, z0 + i * 1.1, 2.1, .68, .025);
      }
    }

    // A light pole on alternating blocks adds detail without filling the scene with tiny meshes.
    if (positiveMod(cx + cz, 2) === 0) {
      const lx = x0 + 8.4, lz = z0 + 9.2;
      addBox(group, 'streetlight pole', poleMat, lx, 2.7, lz, .12, 5.4, .12);
      addBox(group, 'streetlight arm', poleMat, lx + 0.65, 5.3, lz, 1.25, .12, .12);
      addBox(group, 'streetlight lamp', lampMat, lx + 1.15, 5.24, lz, .42, .12, .26);
    }

    const isFarChunk = !nearCenter;
    const townRoll = rand();
    const isTower = !isFarChunk && (townRoll < .15 || (Math.abs(cx) + Math.abs(cz) < 3 && townRoll < .32));
    const primaryPool = isFarChunk ? lowNames.concat(wideLowNames) : (isTower ? towerNames : regularNames);
    const primaryIndex = positiveMod(cx * 7 + cz * 11 + Math.floor(rand() * 13), primaryPool.length);
    const primaryName = primaryPool[primaryIndex];
    const primaryX = midX + (isTower ? 0 : (rand() > .5 ? -8.5 : 8.5));
    const primaryZ = midZ + (isTower ? 0 : (rand() > .5 ? -3.5 : 3.5));
    const secondaryName = isTower ? null : (isFarChunk ? lowNames[positiveMod(cx * 3 + cz * 5, lowNames.length)] : regularNames[positiveMod(cx * 5 - cz * 3 + 4, regularNames.length)]);
    const secondaryX = primaryX < midX ? midX + 8.5 : midX - 8.5;
    const secondaryZ = midZ + (primaryZ < midZ ? 7.5 : -7.5);
    const jobs = [
      { name: primaryName, x: primaryX, z: primaryZ, w: isTower ? 20 : 13, d: isTower ? 21 : 14, h: isTower ? 78 : 25, yaw: rand() * Math.PI * 2, tower: isTower },
      ...(secondaryName ? [{ name: secondaryName, x: secondaryX, z: secondaryZ, w: 12, d: 13, h: 22, yaw: rand() * Math.PI * 2, tower: false }] : [])
    ];

    // Add small yard greenery while keeping clear of the roads.
    if (!isTower && rand() > .25) {
      const tx = midX + (rand() > .5 ? 15 : -15);
      const tz = midZ + (rand() > .5 ? 15 : -15);
      addBox(group, 'tree trunk', trunkMat, tx, 1.1, tz, .36, 2.2, .36);
      const leaves = new THREE.Mesh(treeGeo, leafMat);
      leaves.position.set(tx, 2.9, tz);
      leaves.scale.set(1.35, 1.55, 1.35);
      group.add(leaves);
    }

    Promise.all(jobs.map(async job => {
      try {
        const template = await loadModel(job.name);
        // A chunk may have been unloaded while its model was downloading.
        if (chunks.get(key) !== chunk) return;
        const model = fitModel(template, job.x, job.z, job.w, job.d, job.h, job.yaw);
        model.name = job.name;
        group.add(model);
        chunk.pending = false;
      } catch (error) {
        console.warn('[ISB Street Legacy] Could not load ' + job.name, error);
        if (chunks.get(key) !== chunk) return;
        addBuildingFallback(group, job.x, job.z, rand, job.tower);
        chunk.pending = false;
      }
    }));

    // Storefront/canopy details are optional and only requested in nearby blocks.
    if (!isFarChunk && !isTower && rand() < .22) {
      const detailName = detailNames[positiveMod(cx * 13 + cz * 17, detailNames.length)];
      loadModel(detailName).then(template => {
        if (chunks.get(key) !== chunk) return;
        const detail = fitModel(template, midX, midZ + 8, 5, 3, 4, 0);
        detail.name = detailName;
        group.add(detail);
      }).catch(() => {});
    }
    return chunk;
  }

  const chunks = new Map();
  let lastChunkX = NaN, lastChunkZ = NaN, streamBusy = false;
  function updateStreaming(force = false) {
    const LOAD_RADIUS = Math.min(5, BASE_LOAD_RADIUS + Math.floor(Math.max(0, camera.position.y - 20) / 35));
    const centerX = Math.floor(camera.position.x / CHUNK_X);
    const centerZ = Math.floor(camera.position.z / CHUNK_Z);
    if (!force && centerX === lastChunkX && centerZ === lastChunkZ) return;
    if (streamBusy && !force) return;
    streamBusy = true;
    lastChunkX = centerX;
    lastChunkZ = centerZ;
    const wanted = new Set();
    for (let dz = -LOAD_RADIUS; dz <= LOAD_RADIUS; dz++) {
      for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
        const cx = centerX + dx, cz = centerZ + dz;
        if (Math.abs(cx * CHUNK_X) > WORLD_LIMIT || Math.abs(cz * CHUNK_Z) > WORLD_LIMIT) continue;
        const key = cx + ',' + cz;
        wanted.add(key);
        if (!chunks.has(key)) {
          const distance = Math.max(Math.abs(dx), Math.abs(dz));
          createChunk(cx, cz, distance <= 1);
        }
      }
    }
    for (const [key, chunk] of chunks) {
      if (!wanted.has(key)) {
        scene.remove(chunk.group);
        chunk.group.traverse(obj => {
          // Shared model geometry/materials stay cached for reuse; dispose only unique temporary geometries.
          if (obj.isMesh && (obj.geometry !== boxGeo && obj.geometry !== treeGeo && obj.geometry !== roofGeo)) {
            if (obj.geometry && !obj.userData.sharedModelGeometry) obj.geometry.dispose();
          }
        });
        chunks.delete(key);
      }
    }
    streamBusy = false;
  }
  updateStreaming(true);

  // Free camera: mouse/touch look, WASD/arrows, Shift to move faster, left-side joystick.
  let yaw = 0;
  let pitch = -.06;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let moveX = 0, moveY = 0;
  let paused = false;
  const keys = new Set();
  let verticalInput = 0;
  const onKeyDown = e => {
    if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift','Control','q','e'].includes(e.key)) {
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
      keys.add(e.key.toLowerCase());
    }
  };
  const onKeyUp = e => keys.delete(e.key.toLowerCase());
  const onPointerDown = e => {
    if (paused || e.clientX < window.innerWidth * .42) return;
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = e => {
    if (!dragging || paused) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    yaw -= dx * .0042;
    pitch = THREE.MathUtils.clamp(pitch - dy * .0032, -1.35, 1.15);
    lastX = e.clientX; lastY = e.clientY;
  };
  const onPointerUp = () => { dragging = false; };
  const onWheel = e => { camera.position.y = THREE.MathUtils.clamp(camera.position.y + e.deltaY * .035, 1.4, 220); };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => { keys.clear(); moveX = 0; moveY = 0; dragging = false; });

  let lastTime = performance.now(), sampleStart = lastTime, frames = 0, running = true;
  function resize() {
    const viewport = window.visualViewport;
    const w = Math.max(1, Math.round(viewport?.width || window.innerWidth));
    const h = Math.max(1, Math.round(viewport?.height || window.innerHeight));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.15));
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('orientationchange', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', resize, { passive: true });

  function animate(now) {
    if (!running) return;
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, .05);
    lastTime = now;
    frames++;
    if (now - sampleStart >= 600) {
      const fps = Math.round(frames * 1000 / (now - sampleStart));
      const frameMs = Math.round((now - sampleStart) / Math.max(frames, 1) * 10) / 10;
      onStats({ fps, frameMs, renderer: 'WebGL · streamed city' });
      frames = 0; sampleStart = now;
    }
    if (!paused) {
      let forward = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - moveY;
      let strafe = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0) + moveX;
      const length = Math.hypot(forward, strafe);
      if (length > 1) { forward /= length; strafe /= length; }
      const speed = (keys.has('shift') ? 24 : 11) * dt;
      camera.position.x = THREE.MathUtils.clamp(camera.position.x + (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) * speed, -WORLD_LIMIT, WORLD_LIMIT);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) * speed, -WORLD_LIMIT, WORLD_LIMIT);
      const ascend = keys.has(' ') || keys.has('e') || verticalInput > 0;
      const descend = keys.has('control') || keys.has('q') || verticalInput < 0;
      if (ascend !== descend) camera.position.y += (ascend ? 1 : -1) * (keys.has('shift') ? 42 : 22) * dt;
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.4, 220);
      updateStreaming();
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
      const ratio = level === 'high' ? 1.2 : level === 'low' ? .75 : 1;
      renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * ratio, 1.15));
      resize();
    },
    dispose() {
      running = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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
