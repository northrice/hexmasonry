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

/*export function loadModels(configArray) {
  const loader = new GLTFLoader();

  // Detect total models and names
  const totalModels = configArray.length;
  const modelNames = configArray.map(cfg => cfg.name || 'Unnamed');
  console.log(`✨ Preparing to load ${totalModels} model(s): ${modelNames.join(', ')}`);

  // Collect all load promises
  const loadPromises = configArray.map((config, layerIndex) => {
    const loadMethod = config.sourceType === 'fetch' ? loadViaFetch : loadViaDirect;

    return loadMethod(loader, config)
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
      .catch(err => {
        console.error(`❌ Error loading model on layer ${layerIndex}`, err);
        // Optionally: rethrow to fail the whole batch, or just resolve to continue
        // throw err;
      });
  });

  // Return a promise that resolves when all models are loaded
  return Promise.all(loadPromises);
}*/

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

import { RGBELoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'https://esm.sh/three@0.155.0/src/extras/PMREMGenerator.js';

const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Helper to load and apply HDRI environment map
function applyHdriEnvironment(hdriUrl) {
  return new Promise((resolve, reject) => {
    new RGBELoader()
      .setPath('') // No path, use full URL
      .load(hdriUrl, (hdrEquirect) => {
        const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
        scene.environment = envMap;
        scene.background = new THREE.Color(0xfffff0); // Or: scene.background = envMap;
        hdrEquirect.dispose();
        // pmremGenerator.dispose(); // Don't dispose if you might load more HDRIs
        resolve();
      }, undefined, reject);
  });
}

export function loadModels(config) {
  const loader = new GLTFLoader();

  // Get hdriUrl from the top-level config
  const hdriUrl = config.hdriUrl;
  const models = config.models;

  // Prepare HDRI promise (if any)
  let hdriPromise = Promise.resolve();
  if (hdriUrl) {
    hdriPromise = applyHdriEnvironment(hdriUrl);
  }

  // Model loading as before
  const loadPromises = models.map((modelConfig, layerIndex) => {
    const loadMethod = modelConfig.sourceType === 'fetch' ? loadViaFetch : loadViaDirect;

    return loadMethod(loader, modelConfig)
      .then(gltf => {
        const model = gltf.scene;
        model.name = modelConfig.name || `Model_${layerIndex}`;
        model.scale.setScalar(modelConfig.scale);
        model.position.set(
          modelConfig.position.x,
          modelConfig.position.y,
          modelConfig.position.z
        );

        ensureMeshesFromGeometry(model);
        let index = 0;
        model.traverse(obj => {
          if (obj.isMesh && obj.material) {
            obj.castShadow = !!modelConfig.castShadow;
            obj.receiveShadow = !!modelConfig.receiveShadow;
            obj.layers.set(layerIndex);
            if (!obj.name) obj.name = `${model.name}_AutoMesh_${index++}`;
          }
        });

        scene.add(model);

        if (modelConfig.type === 'subject') applyLightingToSubject(model);
        if (modelConfig.type === 'environment') applyEnvironmentLighting();

        if (Array.isArray(modelConfig.lights)) {
          modelConfig.lights.forEach(lightConfig => createLight(lightConfig, model));
        }

        if (modelConfig.exposeGlobalName) window[modelConfig.exposeGlobalName] = model;
      })
      .catch(err => {
        console.error(`❌ Error loading model on layer ${layerIndex}`, err);
      });
  });

  // Wait for HDRI to load before loading models
  return hdriPromise.then(() => Promise.all(loadPromises));
}

// RESIZE HANDLING
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});