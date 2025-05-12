import * as THREE from 'https://esm.sh/three@0.155.0';
import { OrbitControls } from 'https://esm.sh/three@0.155.0/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://esm.sh/three@0.155.0/examples/jsm/libs/lil-gui.module.min.js';
// import { RGBELoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/GLTFLoader.js';
// import { Brush, Evaluator, ADDITION } from 'https://esm.sh/three-bvh-csg@0.0.17';

// POST PROCESSING IMPORTS
import { EffectComposer } from 'https://esm.sh/three@0.155.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.155.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.155.0/examples/jsm/postprocessing/UnrealBloomPass.js';

import { RectAreaLightHelper } from 'https://esm.sh/three@0.155.0/examples/jsm/helpers/RectAreaLightHelper.js';




window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.GUI = GUI;
window.GLTFLoader = GLTFLoader;

window.EffectComposer = EffectComposer;
window.RenderPass = RenderPass;
window.UnrealBloomPass = UnrealBloomPass;

window.RectAreaLightHelper = RectAreaLightHelper;

export {
  THREE,
  OrbitControls,
  GUI,
  GLTFLoader,
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  RectAreaLightHelper
};
