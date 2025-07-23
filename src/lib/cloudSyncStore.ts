import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types following functional programming principles
interface CloudSyncState {
  // Settings - only auto sync remains as user preference
  autoSyncTables: boolean;
  lastTableSyncTime: string | null;
  
  // State - derived from network and backend status
  isBackendAvailable: boolean | null;
  syncInProgress: boolean;
  pendingTableChanges: number;
  syncedTableChanges: number;
  
  // Actions - pure functions that don't mutate external state
  setAutoSyncTables: (enabled: boolean) => void;
  setLastTableSyncTime: (time: string | null) => void;
  setBackendAvailable: (available: boolean) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  setPendingTableChanges: (count: number) => void;
  setSyncedTableChanges: (count: number) => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
  incrementSyncedChanges: () => void;
  resetSyncCounts: () => void;
}

// Pure function to calculate if sync should be enabled
const shouldEnableSync = (isOnline: boolean, isBackendAvailable: boolean | null): boolean => 
  isOnline && isBackendAvailable === true;

// Pure function to create new state with updated pending changes
const updatePendingChanges = (currentCount: number, increment: boolean): number => 
  increment ? currentCount + 1 : Math.max(0, currentCount - 1);

// Pure function to create new state with updated synced changes
const updateSyncedChanges = (currentCount: number, increment: number): number => 
  currentCount + increment;

export const useCloudSyncStore = create<CloudSyncState>()(
  persist(
    (set) => ({
      // Initial state
      autoSyncTables: false,
      lastTableSyncTime: null,
      isBackendAvailable: null,
      syncInProgress: false,
      pendingTableChanges: 0,
      syncedTableChanges: 0,

      // Actions - pure functions that return new state
      setAutoSyncTables: (enabled) => set({ autoSyncTables: enabled }),
      
      setLastTableSyncTime: (time) => set({ lastTableSyncTime: time }),
      
      setBackendAvailable: (available) => set({ isBackendAvailable: available }),
      
      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),
      
      setPendingTableChanges: (count) => set({ pendingTableChanges: count }),
      
      setSyncedTableChanges: (count) => set({ syncedTableChanges: count }),
      
      incrementPendingChanges: () => set((state) => ({ 
        pendingTableChanges: updatePendingChanges(state.pendingTableChanges, true)
      })),
      
      decrementPendingChanges: () => set((state) => ({ 
        pendingTableChanges: updatePendingChanges(state.pendingTableChanges, false)
      })),
      
      incrementSyncedChanges: () => set((state) => ({ 
        syncedTableChanges: updateSyncedChanges(state.syncedTableChanges, 1)
      })),
      
      resetSyncCounts: () => set({ 
        pendingTableChanges: 0, 
        syncedTableChanges: 0 
      }),
    }),
    {
      name: 'cloud-sync-storage',
      partialize: (state) => ({
        autoSyncTables: state.autoSyncTables,
        lastTableSyncTime: state.lastTableSyncTime,
      }),
    }
  )
);

// Pure function to get sync status
export const getSyncStatus = (state: CloudSyncState, isOnline: boolean) => ({
  shouldSync: shouldEnableSync(isOnline, state.isBackendAvailable),
  canAutoSync: shouldEnableSync(isOnline, state.isBackendAvailable) && state.autoSyncTables,
  isBackendAvailable: state.isBackendAvailable,
  syncInProgress: state.syncInProgress,
  pendingChanges: state.pendingTableChanges,
  syncedChanges: state.syncedTableChanges,
  lastSyncTime: state.lastTableSyncTime,
}); 