import { writable } from 'svelte/store';

export const modal = (function(){
  const { subscribe, set, update } = writable(null);
  const dataStore = writable({});

  return {
    subscribe,
    show: (name, data = {}) => { dataStore.set(data); set(name); },
    hide: () => set(null),
    data: dataStore
  };
})();

export const modalData = modal.data;
