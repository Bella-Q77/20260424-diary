import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const dataPath = path.join(app.getPath('userData'), 'diary-data.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: '日记',
    icon: path.join(__dirname, '../../assets/icon.ico'),
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('load-data', async () => {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
});

ipcMain.handle('save-data', async (_, data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('export-data', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: '导出日记数据',
      defaultPath: path.join(app.getPath('documents'), `diary-export-${new Date().toISOString().split('T')[0]}.json`),
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePath) {
      const currentData = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf-8') : '{}';
      fs.writeFileSync(result.filePath, currentData, 'utf-8');
      return { success: true };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error('Error exporting data:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('import-data', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '导入日记数据',
      properties: ['openFile'],
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const importedData = fs.readFileSync(result.filePaths[0], 'utf-8');
      const parsedData = JSON.parse(importedData);
      fs.writeFileSync(dataPath, JSON.stringify(parsedData, null, 2), 'utf-8');
      return { success: true, data: parsedData };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: String(error) };
  }
});
