const { app, BrowserWindow, globalShortcut, ipcMain, screen, Menu, Tray, nativeImage } = require('electron');
const path = require('path');

let overlayWindow = null;
let tray = null;
let isActive = false;

// ── Hide from dock immediately ─────────────────────────────────
// This must be called before app is ready for full effect
if (app.dock) app.dock.hide();

function createOverlayWindow() {
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
    // Prevent from showing in Cmd+Tab switcher
    type: 'panel',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

  overlayWindow.on('closed', () => { overlayWindow = null; });
}

function createTray() {
  // Load the white template icon for menu bar
  let icon;
  try {
    icon = nativeImage.createFromPath(path.join(__dirname, 'trayIcon.png'));
    // Mark as template so macOS handles dark/light mode automatically
    icon.setTemplateImage(true);
  } catch (e) {
    // Fallback: programmatically drawn minimal icon
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('ScreenInk — Right-click for options');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Toggle Overlay', accelerator: 'CmdOrCtrl+Shift+A', click: toggleOverlay },
    { label: 'Clear Canvas',   accelerator: 'CmdOrCtrl+Shift+C', click: () => { if (overlayWindow) overlayWindow.webContents.send('clear-canvas'); } },
    { type: 'separator' },
    { label: 'Quit ScreenInk', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
}

function toggleOverlay() {
  if (!overlayWindow) return;
  isActive = !isActive;

  if (isActive) {
    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.focus();
    overlayWindow.webContents.send('overlay-activated');
    tray.setToolTip('ScreenInk — Active (⌘⇧A to hide)');
  } else {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    overlayWindow.webContents.send('overlay-deactivated');
    tray.setToolTip('ScreenInk — Click to toggle');
  }
}

app.whenReady().then(() => {
  // Ensure no dock icon
  if (app.dock) app.dock.hide();

  createOverlayWindow();
  createTray();

  // Global shortcuts
  globalShortcut.register('CommandOrControl+Shift+A', toggleOverlay);
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (overlayWindow) overlayWindow.webContents.send('clear-canvas');
  });
  globalShortcut.register('CommandOrControl+Shift+Z', () => {
    if (overlayWindow && isActive) overlayWindow.webContents.send('undo');
  });

  console.log('ScreenInk running in menu bar. Press ⌘⇧A to toggle.');
});

ipcMain.on('deactivate-overlay', () => {
  isActive = false;
  if (overlayWindow) overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  if (tray) tray.setToolTip('ScreenInk — Click to toggle');
});

ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (overlayWindow) {
    if (ignore) overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    else overlayWindow.setIgnoreMouseEvents(false);
  }
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { /* keep running in menu bar */ });
app.on('before-quit', () => { if (tray) tray.destroy(); });