import { create } from 'zustand';
import { settingsOperations } from './database';
import { useEffect } from 'react';

export interface ImageSettingsState {
  convertToWebP: boolean;
  imageQuality: number[];
  syncImagesToS3: boolean;
  showImageNotifications: boolean;
  setConvertToWebP: (v: boolean) => void;
  setImageQuality: (v: number[]) => void;
  setSyncImagesToS3: (v: boolean) => void;
  setShowImageNotifications: (v: boolean) => void;
}

export const useImageSettingsStore = create<ImageSettingsState>((set) => ({
  convertToWebP: false,
  imageQuality: [80],
  syncImagesToS3: false,
  showImageNotifications: true,
  setConvertToWebP: (v) => set({ convertToWebP: v }),
  setImageQuality: (v) => set({ imageQuality: v }),
  setSyncImagesToS3: (v) => set({ syncImagesToS3: v }),
  setShowImageNotifications: (v) => set({ showImageNotifications: v }),
}));

export function getImageSettingsSnapshot() {
  const state = useImageSettingsStore.getState();
  return {
    convertToWebP: state.convertToWebP,
    imageQuality: state.imageQuality,
    syncImagesToS3: state.syncImagesToS3,
    showImageNotifications: state.showImageNotifications,
  };
}

export async function loadImageSettingsFromDB() {
  const imageQuality = await settingsOperations.get('imageQuality');
  if (typeof imageQuality === 'number') {
    useImageSettingsStore.getState().setImageQuality([imageQuality]);
  } else if (Array.isArray(imageQuality) && typeof imageQuality[0] === 'number') {
    useImageSettingsStore.getState().setImageQuality(imageQuality);
  }
  const convertToWebP = await settingsOperations.get('convertToWebp');
  if (typeof convertToWebP === 'boolean') {
    useImageSettingsStore.getState().setConvertToWebP(convertToWebP);
  }
  const syncImagesToS3 = await settingsOperations.get('syncImagesToS3');
  if (typeof syncImagesToS3 === 'boolean') {
    useImageSettingsStore.getState().setSyncImagesToS3(syncImagesToS3);
  }
  const showImageNotifications = await settingsOperations.get('showImageNotifications');
  if (typeof showImageNotifications === 'boolean') {
    useImageSettingsStore.getState().setShowImageNotifications(showImageNotifications);
  }
}

// Auto-save image settings to IndexedDB whenever they change
export function usePersistImageSettings() {
  useEffect(() => {
    const unsub = useImageSettingsStore.subscribe((state, prevState) => {
      if (state.imageQuality !== prevState.imageQuality) {
        settingsOperations.set('imageQuality', state.imageQuality);
      }
      if (state.convertToWebP !== prevState.convertToWebP) {
        settingsOperations.set('convertToWebp', state.convertToWebP);
      }
      if (state.syncImagesToS3 !== prevState.syncImagesToS3) {
        settingsOperations.set('syncImagesToS3', state.syncImagesToS3);
      }
      if (state.showImageNotifications !== prevState.showImageNotifications) {
        settingsOperations.set('showImageNotifications', state.showImageNotifications);
      }
    });
    return unsub;
  }, []);
}
