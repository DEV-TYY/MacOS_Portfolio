import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { INITIAL_Z_INDEX, WINDOW_CONFIG } from "#constants/index.js";

const useWindowStore = create(
  immer((set, get) => ({
    windows: WINDOW_CONFIG,
    nextZIndex: INITIAL_Z_INDEX + 1,
    minimizedWindows: [], // Track minimized windows history

    openWindow: (windowKey, data = null) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;

        win.isOpen = true;
        win.isMinimized = false;
        win.isFullscreen = false;
        win.zIndex = state.nextZIndex;
        if (data !== null) win.data = data;

        state.nextZIndex++;
      }),

    closeWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;

        win.isOpen = false;
        win.isMinimized = false;
        win.isFullscreen = false;
        win.zIndex = INITIAL_Z_INDEX;
        win.data = null;
        // Remove from minimized windows history
        state.minimizedWindows = state.minimizedWindows.filter(key => key !== windowKey);
      }),

    minimizeWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win || !win.isOpen) return;

        win.isMinimized = true;
        // Add to minimized windows history if not already there
        if (!state.minimizedWindows.includes(windowKey)) {
          state.minimizedWindows.push(windowKey);
        }
      }),

    restoreWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;

        win.isMinimized = false;
        // Remove from minimized windows history
        state.minimizedWindows = state.minimizedWindows.filter(key => key !== windowKey);

        if (!win.isOpen) {
          win.isOpen = true;
          win.zIndex = state.nextZIndex;
          state.nextZIndex++;
        } else {
          win.zIndex = state.nextZIndex;
          state.nextZIndex++;
        }
      }),

    toggleFullscreen: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win || !win.isOpen) return;

        win.isFullscreen = !win.isFullscreen;
        if (win.isFullscreen) {
          win.zIndex = state.nextZIndex;
          state.nextZIndex++;
        }
      }),

    focusWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win || !win.isOpen || win.isMinimized) return;

        win.zIndex = state.nextZIndex;
        state.nextZIndex++;
      }),

    // Bonus: Toggle function directly in the store (recommended)
    toggleWindow: (windowKey, data = null) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;

        if (win.isOpen) {
          win.isOpen = false;
          win.isMinimized = false;
          win.isFullscreen = false;
          win.zIndex = INITIAL_Z_INDEX;
          win.data = null;
        } else {
          win.isOpen = true;
          win.isMinimized = false;
          win.isFullscreen = false;
          win.zIndex = state.nextZIndex;
          if (data !== null) win.data = data;
          state.nextZIndex++;
        }
      }),
  }))
);

export default useWindowStore;