import { THREE, GLTFLoader } from './globals.js';
import { scene, camera, renderer, params } from './setup.js';
import {
  applyLightingToSubject,
  applyEnvironmentLighting
} from './lighting.js';

// Helper: Ensure all geometry-only nodes are wrapped in a Mesh
function ensureMeshesFromGeometry(object, defaultMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })) {
  object.traverse((child, index) => {
    if (!child.isMesh && child.geometry) {
      const mesh = new THREE.Mesh(child.geometry, defaultMaterial);
      mesh.position.copy(child.position);
      mesh.rotation.copy(child.rotation);
      mesh.scale.copy(child.scale);

      mesh.name = child.name || `GeneratedMesh_${index}`;
      child.parent.add(mesh);
      child.parent.remove(child);
    }
  });
}

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

    ensureMeshesFromGeometry(model);

    let index = 0;
    model.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = true;
        obj.receiveShadow = false;
        obj.layers.set(0);
        if (!obj.name) obj.name = `AutoMesh_Subject_${index++}`;
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
const envModelUrl = 'scene/models/hexmasonry-mockup-model.glb';
const envLoader = new GLTFLoader();

envLoader.load(
  envModelUrl,
  gltf => {
    const env = gltf.scene;
    env.name = 'EnvironmentModel';
    env.scale.setScalar(params.envScale);
    env.position.set(params.envPosX, params.envPosY, params.envPosZ);

    ensureMeshesFromGeometry(env);

    let index = 0;
    env.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = false;
        obj.receiveShadow = true;
        obj.layers.set(1);
        if (!obj.name) obj.name = `AutoMesh_Env_${index++}`;
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