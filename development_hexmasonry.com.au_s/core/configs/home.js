// core/configs/home.js

const configs = [
  {
    name: 'MainModel',
    url: 'https://floralwhite-wasp-616415.hostingersite.com/serve-model.php',
    sourceType: 'fetch',
    type: 'subject',
    exposeGlobalName: 'mainModel',
    scale: 1,
    position: { x: 0, y: -0.1, z: 0 },
    castShadow: true,
    receiveShadow: false,
    lights: [
      {
        type: 'spot',
        color: 0xffffff,
        intensity: 1,
        position: { x: 5, y: 10, z: 5 },
        castShadow: true,
        targetModel: true
      },
      {
        type: 'hemisphere',
        skyColor: 0xffffff,
        groundColor: 0x444444,
        intensity: 0.6
      }
    ]
  },
  {
    name: 'EnvironmentModel',
    url: 'https://northrice.github.io/hexmasonry/scene/models/hexmasonry-mockup-model.glb',
    sourceType: 'direct',
    type: 'environment',
    exposeGlobalName: 'envModel',
    scale: 1,
    position: { x: 0, y: 0, z: 0 },
    castShadow: true,
    receiveShadow: false,
    lights: [
      {
        type: 'spot',
        color: 0xffffff,
        intensity: 1,
        position: { x: 5, y: 10, z: 5 },
        castShadow: true,
        targetModel: true
      },
      {
        type: 'hemisphere',
        skyColor: 0xffffff,
        groundColor: 0x444444,
        intensity: 0.6
      }
    ]
  },
  {
    name: 'TestModel',
    url: 'https://northrice.github.io/hexmasonry/scene/models/modern_kitchen.glb',
    sourceType: 'direct',
    type: 'test',
    exposeGlobalName: 'envtest',
    scale: 1,
    position: { x: 0, y: 0, z: 0 },
    castShadow: true,
    receiveShadow: false,
    lights: [
      {
        type: 'spot',
        color: 0xffffff,
        intensity: 1,
        position: { x: 5, y: 10, z: 5 },
        castShadow: true,
        targetModel: true
      },
      {
        type: 'hemisphere',
        skyColor: 0xffffff,
        groundColor: 0x444444,
        intensity: 0.6
      }
    ]
  }
];

export default configs;
