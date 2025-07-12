import { create } from 'zustand';

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
