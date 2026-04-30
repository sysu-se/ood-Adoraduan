import { derived } from 'svelte/store';
import { gameStore } from '../../stores/gameStore';

// expose a `grid` like the old store: a readable store with current grid value
export const grid = derived(gameStore, $g => $g.grid);

// stub getSencode used by Share.svelte; produce a simple JSON string as fallback
export function getSencode(g) {
  try {
    return btoa(JSON.stringify(g));
  } catch (e) {
    return '';
  }
}
