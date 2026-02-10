import { create } from 'zustand';

type BlockState = {
  blockedIds: Set<string>;
  isLoaded: boolean;
  setBlockedIds: (ids: Set<string>) => void;
  addBlockedId: (id: string) => void;
  removeBlockedId: (id: string) => void;
  reset: () => void;
};

export const useBlockStore = create<BlockState>((set, get) => ({
  blockedIds: new Set<string>(),
  isLoaded: false,

  setBlockedIds: (ids) => set({ blockedIds: ids, isLoaded: true }),

  addBlockedId: (id) => {
    const next = new Set(get().blockedIds);
    next.add(id);
    set({ blockedIds: next });
  },

  removeBlockedId: (id) => {
    const next = new Set(get().blockedIds);
    next.delete(id);
    set({ blockedIds: next });
  },

  reset: () => set({ blockedIds: new Set<string>(), isLoaded: false }),
}));
