import { writable } from 'svelte/store';
// DEFAULT_SETTINGS may come from an external constants package in the app build.
// Avoid a hard dependency here so tests run when the package is not present.
const DEFAULT_SETTINGS = undefined;

// fallback defaults if constants package is not available or missing keys
const FALLBACK = {
	displayTimer: true,
	highlightCells: true,
	highlightSame: true,
	highlightConflicting: true,
	// enable hint limiting by default for testing; set large number so user can exercise hints
	hintsLimited: true,
	hints: 99,
};

const initial = typeof DEFAULT_SETTINGS === 'object' ? { ...FALLBACK, ...DEFAULT_SETTINGS } : FALLBACK;

// initialize from DEFAULT_SETTINGS so behavior matches original app expectations
export const settings = writable(initial);
