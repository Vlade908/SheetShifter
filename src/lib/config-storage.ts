import type { SavedSpreadsheetConfig } from '@/types';

const CONFIG_PREFIX = 'sheetsifter-config-';
const RECENT_FILES_KEY = 'sheetsifter-recent-files';
const MAX_RECENT_FILES = 5;

export function saveConfig(fileName: string, config: SavedSpreadsheetConfig): void {
  try {
    localStorage.setItem(`${CONFIG_PREFIX}${fileName}`, JSON.stringify(config));
    addRecentFile(fileName);
  } catch (error) {
    console.error("Failed to save config to localStorage", error);
  }
}

export function loadConfig(fileName: string): SavedSpreadsheetConfig | null {
  try {
    const configStr = localStorage.getItem(`${CONFIG_PREFIX}${fileName}`);
    if (configStr) {
      return JSON.parse(configStr) as SavedSpreadsheetConfig;
    }
    return null;
  } catch (error) {
    console.error("Failed to load config from localStorage", error);
    return null;
  }
}

export function getRecentFiles(): string[] {
  try {
    const recentFilesStr = localStorage.getItem(RECENT_FILES_KEY);
    return recentFilesStr ? JSON.parse(recentFilesStr) : [];
  } catch (error) {
    console.error("Failed to load recent files from localStorage", error);
    return [];
  }
}

export function addRecentFile(fileName: string): void {
  try {
    let recentFiles = getRecentFiles();
    // Remove the file if it already exists to move it to the top
    recentFiles = recentFiles.filter(f => f !== fileName);
    // Add the new file to the beginning of the list
    recentFiles.unshift(fileName);
    // Limit the number of recent files
    const newRecentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(newRecentFiles));
  } catch (error) {
    console.error("Failed to add recent file to localStorage", error);
  }
}
