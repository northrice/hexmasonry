// build.js – Loads and configures 3D models from config, assigning each to a unique layer with custom settings.

import { THREE, GLTFLoader } from './globals.js';
import { scene, camera, renderer } from './setup.js';
import {
  applyLightingToSubject,
  applyEnvironmentLighting,
  createLight
} from './lighting.js';

// Helper: Ensure all geometry-only nodes are wrapped in a Mesh
function ensureMeshesFromGeometry(object, defaultMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })) {
  object.traverse((child, index) => {
    if (!child.isMesh && child.geometry) {
      const mesh = new THREE.Mesh(child.geometry, defaultMaterial);
      mesh.position.copy(child.position);
      mesh.rotation.copy(child.rotation);
      mesh.scale.copy(child.scale);

      mesh.name = child.name || `GeneratedMesh_${object.name || 'Model'}_${index}`;
      child.parent.add(mesh);
      child.parent.remove(child);
    }
  });
}

export function loadModels(configArray) {
  const loader = new GLTFLoader();

  // Detect total models and names
  const totalModels = configArray.length;
  const modelNames = configArray.map(cfg => cfg.name || 'Unnamed');
  console.log(`✨ Preparing to load ${totalModels} model(s): ${modelNames.join(', ')}`);

  configArray.forEach((config, layerIndex) => {
    const loadMethod = config.sourceType === 'fetch' ? loadViaFetch : loadViaDirect;

    loadMethod(loader, config)
      .then(gltf => {
        const model = gltf.scene;
        model.name = config.name || `Model_${layerIndex}`;
        model.scale.setScalar(config.scale);
        model.position.set(
          config.position.x,
          config.position.y,
          config.position.z
        );

        ensureMeshesFromGeometry(model);
        let index = 0;
        model.traverse(obj => {
          if (obj.isMesh && obj.material) {
            obj.castShadow = !!config.castShadow;
            obj.receiveShadow = !!config.receiveShadow;
            obj.layers.set(layerIndex);
            if (!obj.name) obj.name = `${model.name}_AutoMesh_${index++}`;
          }
        });

        scene.add(model);
        

        if (config.type === 'subject') applyLightingToSubject(model);
        if (config.type === 'environment') applyEnvironmentLighting();

        if (Array.isArray(config.lights)) {
          config.lights.forEach(lightConfig => createLight(lightConfig, model));
        }

        if (config.exposeGlobalName) window[config.exposeGlobalName] = model;
      })
      .catch(err => console.error(`❌ Error loading model on layer ${layerIndex}`, err));
  });
}

function loadViaFetch(loader, config) {
  return fetch(config.url)
    .then(res => res.ok ? res.arrayBuffer() : Promise.reject("Network error"))
    .then(buffer => loader.parseAsync(buffer, ''));
}

function loadViaDirect(loader, config) {
  return new Promise((resolve, reject) => {
    loader.load(config.url, resolve, undefined, reject);
  });
}

// RESIZE HANDLING
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});