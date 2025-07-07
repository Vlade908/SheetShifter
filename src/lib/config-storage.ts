import type { SavedSpreadsheetConfig } from '@/types';

const CONFIG_PREFIX = 'sheetsifter-config-';

export function saveConfig(fileName: string, config: SavedSpreadsheetConfig): void {
  try {
    localStorage.setItem(`${CONFIG_PREFIX}${fileName}`, JSON.stringify(config));
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
