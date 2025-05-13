// gui-export.js
import { gui } from './setup.js';

export function extractGUIParams() {
  const result = {};

  function traverse(folder, store) {
    if (!folder) return;

    if (Array.isArray(folder.controllers)) {
      folder.controllers.forEach(ctrl => {
        const key = ctrl._name || ctrl.property || 'unnamed';
        store[key] = ctrl.getValue?.();
      });
    }

    if (folder.folders) {
      Object.entries(folder.folders).forEach(([name, subFolder]) => {
        store[name] = {};
        traverse(subFolder, store[name]);
      });
    }
  }

  traverse(gui, result);
  return result;
}

export function saveGUIParamsToFile(filename = 'gui-params.json') {
  const data = extractGUIParams();
  const json = JSON.stringify(data, null, 2);

  try {
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
