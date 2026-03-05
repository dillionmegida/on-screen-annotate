const { app, BrowserWindow, globalShortcut, ipcMain, screen, Menu, Tray, nativeImage } = require('electron');
const path = require('path');

let overlayWindow = null;
let tray = null;
let isActive = false;

function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const fullBounds = screen.getPrimaryDisplay().bounds;

  overlayWindow = new BrowserWindow({
    x: fullBounds.x,
    y: fullBounds.y,
    width: fullBounds.width,
    height: fullBounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Start with click-through (invisible to interaction)
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true);

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function createTray() {
  // Create a simple tray icon programmatically
  const iconSize = 16;
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle Overlay (⌘⇧A)',
      click: () => toggleOverlay()
    },
    { type: 'separator' },
    {
      label: 'Quit ScreenInk',
      click: () => app.quit()
    }
  ]);

  tray.setToolTip('ScreenInk');
  tray.setContextMenu(contextMenu);
}

function toggleOverlay() {
  isActive = !isActive;

  if (isActive) {
    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.focus();
    overlayWindow.webContents.send('overlay-activated');
  } else {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.webContents.send('overlay-deactivated');
  }
}

app.whenReady().then(() => {
  createOverlayWindow();

  // Global shortcut to toggle overlay: Cmd+Shift+A
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    toggleOverlay();
  });

  // Global shortcut to clear canvas: Cmd+Shift+C
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (overlayWindow) {
      overlayWindow.webContents.send('clear-canvas');
    }
  });

  // Global shortcut to undo: Cmd+Z (when overlay active)
  globalShortcut.register('CommandOrControl+Shift+Z', () => {
    if (overlayWindow && isActive) {
      overlayWindow.webContents.send('undo');
    }
  });

  app.dock.hide(); // Hide from dock since it's a utility overlay

  console.log('ScreenInk running. Press Cmd+Shift+A to toggle overlay.');
});

ipcMain.on('deactivate-overlay', () => {
  isActive = false;
  if (overlayWindow) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }
});

ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (overlayWindow) {
    if (ignore) {
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      overlayWindow.setIgnoreMouseEvents(false);
    }
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
