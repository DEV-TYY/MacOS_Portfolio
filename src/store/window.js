import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { INITIAL_Z_INDEX, WINDOW_CONFIG } from "#constants/index.js";

const useWindowStore = create(
  immer((set, get) => ({
    windows: WINDOW_CONFIG,
    nextZIndex: INITIAL_Z_INDEX + 1,

    openWindow: (windowKey, data = null) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;

        win.isOpen = true;
        win.zIndex = state.nextZIndex;
        if (data !== null) win.data = data; 

        state.nextZIndex++;
      }),

    closeWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win) return;

        win.isOpen = false;
        // Optional: reset zIndex when closing
        win.zIndex = INITIAL_Z_INDEX;
        win.data = null;
      }),

    focusWindow: (windowKey) =>
      set((state) => {
        const win = state.windows[windowKey];
        if (!win || !win.isOpen) return;

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
          win.zIndex = INITIAL_Z_INDEX;
          win.data = null;
        } else {
          win.isOpen = true;
          win.zIndex = state.nextZIndex;
          if (data !== null) win.data = data;
          state.nextZIndex++;
        }
      }),
  }))
);

export default useWindowStore;