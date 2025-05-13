import './build.js';
import { loadModels } from './build.js';
import { initCameraFocusControls } from './camera-utils.js';
import { camera, renderer, controls } from './setup.js';
import { renderSceneWithBloom } from './scene.js';
import { applyGlobalLighting } from './lighting.js';

// Parse the query from the current script tag, not the page URL
const scriptUrl = new URL(import.meta.url);
const configName = scriptUrl.searchParams.get('config');

import { saveGUIParamsToFile } from './gui-export.js';

window.addEventListener('keydown', (e) => {
  if (e.key === 'p') {
    saveGUIParamsToFile(); // Exports current GUI state to gui-params.json
  }
});

if (!configName) {
  console.error('❌ No config specified in script src (e.g. run.js?config=home.js)');
} else {
  import(`./configs/${configName}`)
    .then(module => {
      loadModels(module.default);
    })
    .catch(err => console.error(`❌ Failed to load config "${configName}":`, err));
}

// Resize + controls
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting & camera init
applyGlobalLighting();
initCameraFocusControls();

// Debug / Dev globals
window.camera = camera;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderSceneWithBloom();
}

animate();

// USE <script type="module" src="https://northrice.github.io/hexmasonry/development_hexmasonry.com.au_merged/core/run.js?config=home"></script>
// with a specific config

