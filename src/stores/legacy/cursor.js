import { writable } from 'svelte/store';

function createCursor() {
  const { subscribe, set, update } = writable({ x: null, y: null });

  return {
    subscribe,
    set: (x, y) => set({ x, y }),
    move: (dx = 0, dy = 0) => update(c => {
      const nx = c.x === null ? (dx || 0) : c.x + dx;
      const ny = c.y === null ? (dy || 0) : c.y + dy;
      return { x: nx, y: ny };
    })
  };
}

export const cursor = createCursor();
