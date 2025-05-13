// core/configs/home.js

// sourceType can be 'fetch' or 'direct'

const config = {
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
  ],
  name: 'EvnironmentModel',
  url: 'scene/models/hexmasonry-mockup-model.glb',
  sourceType: 'direct',
  type: 'subject',
  exposeGlobalName: 'mainModel',
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
  ],
};

export default config;
