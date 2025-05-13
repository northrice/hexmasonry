// gui-export.js
import { gui } from './setup.js';

export function extractGUIParams() {
  const result = {};

  function traverse(folder, store) {
    // Save each controller's value
    folder.controllers.forEach(ctrl => {
      const name = ctrl._name || ctrl.property;
      store[name] = ctrl.getValue();
    });

    // Recursively process subfolders
    Object.entries(folder.folders).forEach(([subFolderName, subFolder]) => {
      store[subFolderName] = {};
      traverse(subFolder, store[subFolderName]);
    });
  }

  traverse(gui, result);
  return result;
}

export function saveGUIParamsToFile(filename = 'gui-params.json') {
  const data = extractGUIParams();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
