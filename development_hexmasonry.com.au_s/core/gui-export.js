import { gui } from './setup.js';

// Forcefully collapse all folders recursively, including hidden ones
export function collapseAllGUIFolders() {
  function collapse(folder) {
    // Force close this folder
    if (folder && typeof folder.close === 'function') {
      folder.close();
    }

    // Handle nested folders via undocumented internal structure
    if (folder && folder._folders) {
      Object.values(folder._folders).forEach(sub => collapse(sub));
    }
  }

  collapse(gui);
}

// Traverse the GUI hierarchy safely
export function extractGUIParams() {
  if (!gui) {
    console.warn('⚠️ GUI instance not found.');
    return {};
  }

  const result = {};

  function traverse(folder, store) {
    if (!folder) return;

    if (Array.isArray(folder.controllers)) {
      folder.controllers.forEach(ctrl => {
        const key = ctrl._name || ctrl.property || 'unnamed';
        try {
          store[key] = ctrl.getValue?.();
        } catch (err) {
          console.warn(`⚠️ Failed to read value for ${key}`, err);
        }
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

// Save parameters to downloadable JSON
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
    console.log('✅ GUI parameters saved as JSON');
  } catch (err) {
    console.warn('⚠️ Blob download failed. Using fallback.', err);
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (typeof alert === 'function') {
    alert('✅ GUI parameters exported.');
  }
}
