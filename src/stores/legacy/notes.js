import { writable } from 'svelte/store';

function createNotes() {
  const { subscribe, set, update } = writable(false);
  return {
    subscribe,
    toggle: () => update(v => !v),
    set
  };
}

export const notes = createNotes();
