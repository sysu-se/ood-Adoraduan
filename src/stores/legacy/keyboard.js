import { derived } from 'svelte/store';
import { cursor } from './cursor';
import { gameStore } from '../../stores/gameStore';

// disable keyboard input when the cursor points to an initial given cell
export const keyboardDisabled = derived([cursor, gameStore], ([$cursor, $gameStore]) => {
	if (!$cursor || $cursor.x === null || $cursor.y === null) return false;
	const ig = $gameStore.initialGrid;
	if (!ig || !ig[$cursor.y]) return false;
	return ig[$cursor.y][$cursor.x] !== 0;
});
