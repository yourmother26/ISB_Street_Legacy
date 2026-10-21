import * as THREE from 'three';

export async function initEngine(canvas, { onStats = () => {} } = {}) {
  if (!canvas) throw new Error('Game canvas was not found.');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x8db8d7, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8db8d7);
  scene.fog = new THREE.Fog(0x8db8d7, 55, 180);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 7, 15);
  camera.lookAt(0, 1, 0);

  const hemi = new THREE.HemisphereLight(0xc7e6ff, 0x4a5360, 2.0);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe5c1, 2.2);
  sun.position.set(-12, 24, 10);
  scene.add(sun);

  // Lightweight placeholder environment; art assets and the city come in later waves.
  const groundGeo = new THREE.PlaneGeometry(240, 240);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x35433d, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  scene.add(ground);

  const roadMat = new THREE.MeshStandardMaterial({ color: 0x292e35, roughness: 0.98 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 110), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.005, -8);
  scene.add(road);

  const markingMat = new THREE.MeshBasicMaterial({ color: 0xe5e1ca });
  for (let z = -55; z < 45; z += 8) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 3.2), markingMat);
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(0, 0.02, z);
    scene.add(mark);
  }

  const buildingMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x737f89, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0x927d68, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x5c6b72, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0xb2a18a, roughness: 0.95 })
  ];
  let seed = 3817;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  for (let side of [-1, 1]) {
    for (let i = 0; i < 20; i++) {
      const width = 3 + random() * 5;
      const height = 4 + random() * 15;
      const depth = 4 + random() * 7;
      const building = new THREE.Mesh(boxGeo, buildingMaterials[Math.floor(random() * buildingMaterials.length)]);
      building.scale.set(width, height, depth);
      building.position.set(side * (10 + random() * 10), height / 2, -52 + i * 5.2);
      scene.add(building);
    }
  }

  // A simple glowing marker gives us a visible point of reference.
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e90ff, emissive: 0x0759b0, emissiveIntensity: 1.4, roughness: 0.4 })
  );
  marker.position.set(0, 1, 4);
  scene.add(marker);

  let targetYaw = 0;
  let yaw = 0;
  let targetPitch = -0.18;
  let pitch = -0.18;
  let dragging = false;
  let lastX = 0, lastY = 0;
  const onPointerDown = (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e) => {
    if (!dragging) return;
    targetYaw -= (e.clientX - lastX) * 0.005;
    targetPitch = THREE.MathUtils.clamp(targetPitch - (e.clientY - lastY) * 0.003, -0.65, 0.15);
    lastX = e.clientX; lastY = e.clientY;
  };
  const onPointerUp = () => { dragging = false; };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  let lastTime = performance.now();
  let sampleStart = lastTime;
  let frames = 0;
  let currentFps = 0;
  let frameMs = 0;
  let running = true;

  function resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize, { passive: true });

  function animate(now) {
    if (!running) return;
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    frames++;
    if (now - sampleStart >= 500) {
      currentFps = Math.round(frames * 1000 / (now - sampleStart));
      frameMs = Math.round((now - sampleStart) / Math.max(frames, 1) * 10) / 10;
      frames = 0;
      sampleStart = now;
      onStats({ fps: currentFps, frameMs, renderer: 'WebGL' });
    }
    yaw += (targetYaw - yaw) * Math.min(1, dt * 8);
    pitch += (targetPitch - pitch) * Math.min(1, dt * 8);
    camera.position.set(Math.sin(yaw) * 15, 7 + pitch * 4, Math.cos(yaw) * 15);
    camera.lookAt(0, 2, -4);
    marker.rotation.y += dt * 0.7;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  return {
    renderer, scene, camera,
    setQuality(level) {
      const ratio = level === 'high' ? 1.5 : level === 'low' ? 0.85 : 1.15;
      renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * ratio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    },
    dispose() {
      running = false;
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
    }
  };
}
