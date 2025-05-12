import {
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  THREE
} from './globals.js';

import { scene, camera, renderer, gui, controls, params } from './setup.js';
import { cameraControls } from './camera-utils.js';

// === BLOOM COMPOSER ===
const composer = new EffectComposer(renderer);

const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

const bloomParams = {
  strength: 0.3,
  radius: 1,
  threshold: 0.14
};

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  bloomParams.strength,
  bloomParams.radius,
  bloomParams.threshold
);
composer.addPass(bloomPass);

// === GUI CONTROLS ===
const bloomFolder = gui.addFolder('Bloom');
bloomFolder.add(bloomParams, 'strength', 0, 5).step(0.01).onChange(val => bloomPass.strength = val);
bloomFolder.add(bloomParams, 'radius', 0, 1).step(0.01).onChange(val => bloomPass.radius = val);
bloomFolder.add(bloomParams, 'threshold', 0, 1).step(0.01).onChange(val => bloomPass.threshold = val);
bloomFolder.open();

// === Handle Window Resize ===
window.addEventListener('resize', () => {
  const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
  composer.setSize(size.x, size.y);
  bloomPass.setSize(size.x, size.y);

  camera.aspect = size.x / size.y;
  camera.updateProjectionMatrix();
  renderer.setSize(size.x, size.y);
});

// Enable camera controls
cameraControls(controls); // ✅ Cleaned up this call

// === Exported Render Function ===
export function renderSceneWithBloom() {
  composer.render();
}

// === Exports ===
export {
  scene,
  camera,
  renderer,
  composer
};
