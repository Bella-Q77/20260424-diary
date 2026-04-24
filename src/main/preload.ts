import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data: any) => ipcRenderer.invoke('save-data', data),
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),
});

export interface DiaryRecord {
  id: string;
  content: string;
  tags: string[];
  completed: boolean;
  createdAt: string;
}

export interface DiaryDay {
  date: string;
  weather: string;
  records: DiaryRecord[];
}

export interface DiaryMonth {
  [day: string]: DiaryDay;
}

export interface DiaryYear {
  [month: string]: DiaryMonth;
}

export interface DiaryData {
  years: DiaryYear;
  tags: string[];
}

declare global {
  interface Window {
    electronAPI: {
      loadData: () => Promise<DiaryData | null>;
      saveData: (data: DiaryData) => Promise<{ success: boolean; error?: string }>;
      exportData: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
      importData: () => Promise<{ success: boolean; canceled?: boolean; error?: string; data?: DiaryData }>;
    };
  }
}
