import * as THREE from 'https://esm.sh/three@0.155.0';
import { OrbitControls } from 'https://esm.sh/three@0.155.0/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://esm.sh/three@0.155.0/examples/jsm/libs/lil-gui.module.min.js';
import { RGBELoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/GLTFLoader.js';
import { Brush, Evaluator, ADDITION } from 'https://esm.sh/three-bvh-csg@0.0.17';

window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.GUI = GUI;
window.RGBELoader = RGBELoader;
window.GLTFLoader = GLTFLoader;
window.Brush = Brush;
window.Evaluator = Evaluator;
window.ADDITION = ADDITION;

export {
  THREE,
  OrbitControls,
  GUI,
  RGBELoader,
  GLTFLoader,
  Brush,
  Evaluator,
  ADDITION
};
