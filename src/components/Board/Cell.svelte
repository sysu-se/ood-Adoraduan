<script>
	import Candidates from './Candidates.svelte';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, afterUpdate } from 'svelte';
	import { cursor as legacyCursor } from '../../stores/legacy/cursor';
	import { settings as legacySettings } from '../../stores/legacy/settings';
	import { gameStore } from '../../stores/gameStore';
	import { BOX_SIZE } from '@sudoku/constants';

	// keep prop API stable
	export let value;
	export let cellX;
	export let cellY;
	export let candidates;

	export let disabled = false;
	export let conflictingNumber = false;
	export let userNumber = false;
	export let selected = false;
	export let sameArea = false;
	export let sameNumber = false;
	export let exploreNumber = false;   // 探索模式下填入的数字（蓝色）

	// subscribe to legacy cursor and grid so selection highlights update reliably
	let selectedInternal = selected;
	let sameAreaInternal = sameArea;
	let sameNumberInternal = sameNumber;

	$: (function computeFromStores() {
		const cur = $legacyCursor || { x: null, y: null };
		const gx = cellX - 1;
		const gy = cellY - 1;

		// selected if coordinates match global legacy cursor (do not inherit incoming prop to avoid stale 'last edited' state)
		selectedInternal = (cur.x === gx && cur.y === gy);

		// same area: same row/col or same 3x3 box
		if (cur.x === null || cur.y === null) {
			sameAreaInternal = false;
		} else {
			sameAreaInternal = (cur.x === gx || cur.y === gy ||
				(Math.floor(cur.x / BOX_SIZE) === Math.floor(gx / BOX_SIZE) && Math.floor(cur.y / BOX_SIZE) === Math.floor(gy / BOX_SIZE)));
		}

		// same number: need to check value at cursor in grid
		const grid = $gameStore.grid || [];
		const valAtCursor = (cur.x !== null && cur.y !== null && grid[cur.y] && typeof grid[cur.y][cur.x] !== 'undefined') ? grid[cur.y][cur.x] : null;
		sameNumberInternal = (valAtCursor && value && valAtCursor === value && !(cur.x === gx && cur.y === gy));
	})();

	// assume standard sudoku size (9)
	const SUDOKU_SIZE = 9;
	const borderRight = (cellX !== SUDOKU_SIZE && cellX % 3 !== 0);
	const borderRightBold = (cellX !== SUDOKU_SIZE && cellX % 3 === 0);
	const borderBottom = (cellY !== SUDOKU_SIZE && cellY % 3 !== 0);
	const borderBottomBold = (cellY !== SUDOKU_SIZE && cellY % 3 === 0);

	const dispatch = createEventDispatcher();

	function handleClick() {
		// dispatch select event so parent (Board) can set cursor
		const pos = { x: cellX - 1, y: cellY - 1 };
		// per spec: clicking a non-given cell cancels hint display
		const hints = $gameStore.hints;
		if (!(disabled)) {
			if (hints) {
				gameStore.clearHints();
			}
		}
		dispatch('select', pos);
	}


	$: _inlineStyle = (() => {
	    // givens should always keep a light-gray background and not be overridden
	    if (disabled) return 'background-color: #f3f4f6; color: #1f2937;';

	    // base highlights (selection/area/number)
	    if (selectedInternal) return 'background-color: #2563eb; color: white;';
	    if (sameNumberInternal) return 'background-color: #dbeafe;';
	    if (sameAreaInternal) return 'background-color: #eff6ff;';

	    // hint-driven colors override default highlights when hints exist
	    const hints = $gameStore.hints;
	    if (hints && hints[cellY - 1] && hints[cellY - 1][cellX - 1]) {
			const h = hints[cellY - 1][cellX - 1];
			if (h.type === 'conflict') return 'background-color: #fee2e2; color: #991b1b;'; // light red bg, dark red text
			if (h.type === 'single') return 'background-color: #bbf7d0; color: #065f46;'; // light green bg, dark green text
			if (h.type === 'few') return 'background-color: #e0f2fe; color: #0369a1;'; // light blue bg
			if (h.type === 'many') return ''; // keep default
		}
		return '';
	})();

// debug render state
$: console.log('[Cell] render', { x: cellX - 1, y: cellY - 1, selected: selectedInternal, sameArea: sameAreaInternal, sameNumber: sameNumberInternal, value });

// reliable post-update log (fires after each DOM update)
let _prev = { selected: null, sameArea: null, sameNumber: null, value: null };
afterUpdate(() => {
	if (_prev.selected !== selectedInternal || _prev.sameArea !== sameAreaInternal || _prev.sameNumber !== sameNumberInternal || _prev.value !== value) {
		console.log('[Cell] afterUpdate', { x: cellX - 1, y: cellY - 1, selected: selectedInternal, sameArea: sameAreaInternal, sameNumber: sameNumberInternal, value });
		_prev.selected = selectedInternal;
		_prev.sameArea = sameAreaInternal;
		_prev.sameNumber = sameNumberInternal;
		_prev.value = value;
	}
});
</script>

<div class="cell row-start-{cellY} col-start-{cellX}"
     class:border-r={borderRight}
     class:border-r-4={borderRightBold}
     class:border-b={borderBottom}
     class:border-b-4={borderBottomBold}>

	<div class="cell-inner" style={_inlineStyle}
		 class:user-number={userNumber}
		 class:selected={selectedInternal}
		 class:same-area={sameAreaInternal}
		 class:same-number={sameNumberInternal}
		 class:conflicting-number={conflictingNumber}
		 class:given={disabled}
		 class:explore-number={exploreNumber}>

		<button class="cell-btn" on:click={handleClick} aria-pressed={selectedInternal}>
		{#if $gameStore.hints && $gameStore.hints[cellY - 1] && $gameStore.hints[cellY - 1][cellX - 1]}
			{#if $gameStore.hints[cellY - 1][cellX - 1].type === 'single'}
				<span class="cell-text">{$gameStore.hints[cellY - 1][cellX - 1].value}</span>
			{:else if $gameStore.hints[cellY - 1][cellX - 1].type === 'few'}
				<span class="cell-text small-candidates">[{ $gameStore.hints[cellY - 1][cellX - 1].candidates.join(',') }]</span>
			{:else if $gameStore.hints[cellY - 1][cellX - 1].type === 'many'}
					<span class="cell-text small-candidates">[{ $gameStore.hints[cellY - 1][cellX - 1].candidates[0] },...]</span>
			{:else if $gameStore.hints[cellY - 1][cellX - 1].type === 'conflict'}
				<span class="cell-text">{value || ''}</span>
			{:else}
				<span class="cell-text">{value || ''}</span>
			{/if}
		{:else}
			<span class="cell-text">{value || ''}</span>
		{/if}
		</button>

	</div>

</div>

<style>
	.cell {
		height: 100%;
		width: 100%;
		/* keep grid placement utilities in template classes */
	}

	.cell-inner {
		position: relative;
		height: 100%;
		width: 100%;
		color: #1f2937; /* text-gray-800 */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cell-btn {
		@apply absolute inset-0 h-full w-full;
	}

	.cell-btn:focus {
		@apply outline-none;
	}

	.cell-text {
		line-height: 1;
		font-weight: 500;
		text-align: center;
	}

	@media (min-width: 300px) {
		.cell-text {
			@apply text-lg;
		}
	}

	@media (min-width: 350px) {
		.cell-text {
			@apply text-xl;
		}
	}

	@media (min-width: 400px) {
		.cell-text {
			@apply text-2xl;
		}
	}

	@media (min-width: 500px) {
		.cell-text {
			@apply text-3xl;
		}
	}

	@media (min-width: 600px) {
		.cell-text {
			@apply text-4xl;
		}
	}


	/* Explicit highlight colors to ensure visibility without Tailwind utilities */

	.user-number {
		color: #0ea5a4; /* teal-500 as an example */
	}

	.small-candidates {
		font-size: 0.9em;
		line-height: 1;
		transform: translateY(0%);
		display: inline-block;
		text-align: center;
	}

	.given {
		background-color: #f3f4f6;
	}

	.selected {
		background-color: #2563eb; /* blue-600 */
		color: white;
	}

	.same-area {
		background-color: #eff6ff; /* blue-50 */
	}

	.same-number {
		background-color: #dbeafe; /* blue-100 */
	}

	.conflicting-number {
		color: #dc2626; /* red-600 */
	}

	/* 探索模式下填入的数字：蓝色 */
	.explore-number {
		color: #2563eb; /* blue-600 */
	}
</style>
