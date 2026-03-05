const { contextBridge, ipcRenderer } = require('electron');

// Expose ipcRenderer to renderer process
window.ipcRenderer = ipcRenderer;
