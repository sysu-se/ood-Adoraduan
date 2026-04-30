<script>
	import { BOX_SIZE } from '@sudoku/constants';
	import { gameStore } from '../../stores/gameStore';
	import Cell from './Cell.svelte';
	import { cursor as legacyCursor } from '../../stores/legacy/cursor';
	import { settings as legacySettings } from '../../stores/legacy/settings';

	// use legacy global cursor so clicks and keyboard stay in sync
	$: cursor = $legacyCursor || { x: null, y: null };
	$: grid = $gameStore.grid;
	$: exploreCells = $gameStore.exploreCells || [];

	function isSelected(x, y) {
		return cursor.x === x && cursor.y === y;
	}

	function isSameArea(x, y) {
		if (cursor.x === null && cursor.y === null) return false;
		// same row or same column
		if (cursor.x === x || cursor.y === y) return true;

		const cursorBoxX = Math.floor(cursor.x / BOX_SIZE);
		const cursorBoxY = Math.floor(cursor.y / BOX_SIZE);
		const cellBoxX = Math.floor(x / BOX_SIZE);
		const cellBoxY = Math.floor(y / BOX_SIZE);
		return (cursorBoxX === cellBoxX && cursorBoxY === cellBoxY);
	}

	function getValueAtCursor(gridStore) {
		if (!cursor || cursor.x === null || cursor.y === null) return null;
		return gridStore[cursor.y] && typeof gridStore[cursor.y][cursor.x] !== 'undefined' ? gridStore[cursor.y][cursor.x] : null;
	}

	function handleSelect(e) {
		const { x, y } = e.detail;
		// update global legacy cursor (Board derives its cursor from legacyCursor)
		console.log('[Board] selected cursor', { x, y });
		console.log('[Board] $legacySettings', $legacySettings);
		console.log('[Board] valueAtCursor', getValueAtCursor(grid));
		// also update legacy global cursor so Keyboard and other controls receive selection
		if (legacyCursor && typeof legacyCursor.set === 'function') {
			// if clicking the same selected cell, clear selection
			if ($legacyCursor && $legacyCursor.x === x && $legacyCursor.y === y) {
				legacyCursor.set(null, null);
			} else {
				legacyCursor.set(x, y);
			}
		}
	}
</script>

<!-- debug panel removed -->

<div class="board-padding relative z-10">
	<div class="max-w-xl relative">
		<div class="w-full" style="padding-top: 100%"></div>
	</div>
	<div class="board-padding absolute inset-0 flex justify-center">
		<!-- local flags: until a global settings store is implemented, disable highlights -->
		<div class="bg-white shadow-2xl rounded-xl overflow-hidden w-full h-full max-w-xl grid">
			{#each grid as row, y}
				{#each row as value, x (y + '-' + x)}
					<Cell
						{value}
						cellY={y + 1}
						cellX={x + 1}
						candidates={undefined}
						selected={isSelected(x, y)}
						userNumber={value === 0}
						disabled={$gameStore.initialGrid && $gameStore.initialGrid[y] ? $gameStore.initialGrid[y][x] !== 0 : false}
						sameArea={$legacySettings.highlightCells && !isSelected(x,y) && isSameArea(x, y)}
						sameNumber={$legacySettings.highlightSame && value && !isSelected(x, y) && getValueAtCursor(grid) === value}
						conflictingNumber={false}
						exploreNumber={exploreCells.some(c => c.row === y && c.col === x)}
						on:select={handleSelect}
					/>
				{/each}
			{/each}
		</div>
	</div>
</div>

<style>
	.board-padding {
		@apply px-4 pb-4;
	}
</style>
