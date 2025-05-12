import { THREE, GLTFLoader } from './globals.js';
import { scene, camera, renderer, params } from './setup.js';
import {
  applyLightingToSubject,
  applyEnvironmentLighting
} from './lighting.js';

// === SUBJECT MODEL ===
const subjectModelUrl = 'https://floralwhite-wasp-616415.hostingersite.com/serve-model.php';
const subjectLoader = new GLTFLoader();

fetch(subjectModelUrl, params)
  .then(res => res.ok ? res.arrayBuffer() : Promise.reject("Network error"))
  .then(buffer => subjectLoader.parseAsync(buffer, ''))
  .then(gltf => {
    const model = gltf.scene;
    model.name = 'MainModel';
    model.scale.setScalar(params.modelScale);
    model.position.set(params.modelPosX, params.modelPosY, params.modelPosZ);

    model.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = true;
        obj.receiveShadow = false;
        obj.layers.set(0); // Main layer (no bloom)
      }
    });

    scene.add(model);
    applyLightingToSubject(model);
    window.mainModel = model;
    console.log('✅ Subject model loaded');
  })
  .catch(err => {
    console.error('❌ Error loading subject model', err);
  });

// === ENVIRONMENT MODEL ===
const envModelUrl = 'scene/white_modern_living_room.glb';
const envLoader = new GLTFLoader();

envLoader.load(
  envModelUrl,
  gltf => {
    const env = gltf.scene;
    env.name = 'EnvironmentModel';
    env.scale.setScalar(params.envScale);
    env.position.set(params.envPosX, params.envPosY, params.envPosZ);

    env.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = false;
        obj.receiveShadow = true;
        obj.layers.set(1); // Bloom layer (optional)
      }
    });

    scene.add(env);
    applyEnvironmentLighting();
    window.envModel = env;
    console.log('✅ Environment model loaded');
  },
  undefined,
  err => console.error('❌ Error loading environment model', err)
);

// === Resize Handling ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
