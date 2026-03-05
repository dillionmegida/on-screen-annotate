const { app, BrowserWindow, globalShortcut, ipcMain, screen, Menu, Tray, nativeImage, systemPreferences } = require('electron');
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
  // On macOS, Tray creates an item in the top menu bar (like Docker, battery, etc.)
  // Use template icon for automatic dark/light mode adaptation
  const trayIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/tray-template.png'));
  tray = new Tray(trayIcon);
  
  // Set a title to show alongside the icon in the menu bar
  tray.setTitle('ScreenInk');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle Overlay (⌘⇧A)',
      accelerator: 'CommandOrControl+Shift+A',
      click: () => toggleOverlay()
    },
    { type: 'separator' },
    {
      label: 'Clear Canvas',
      accelerator: 'CommandOrControl+Shift+C',
      click: () => {
        if (overlayWindow) {
          overlayWindow.webContents.send('clear-canvas');
        }
      }
    },
    {
      label: 'Undo',
      accelerator: 'CommandOrControl+Z',
      click: () => {
        if (overlayWindow && isActive) {
          overlayWindow.webContents.send('undo');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit ScreenInk',
      accelerator: 'CommandOrControl+Q',
      click: () => app.quit()
    }
  ]);

  tray.setToolTip('ScreenInk - Screen Annotation Tool');
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
  createTray();

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

  // Global shortcut to close menu/overlay: Escape
  globalShortcut.register('Escape', () => {
    // Close menu if open (by clicking elsewhere)
    if (isActive) {
      toggleOverlay();
    }
  });

  // Global shortcut to undo: Cmd+Z (when overlay active)
  globalShortcut.register('CommandOrControl+Z', () => {
    if (overlayWindow && isActive) {
      overlayWindow.webContents.send('undo');
    }
  });

  app.dock.hide(); // Hide from dock since it's a utility overlay

  console.log('ScreenInk running. Press Cmd+Shift+A to toggle overlay, or Escape to close.');
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
