import { writable } from 'svelte/store';

export const timer = writable(0);

// pause flag and APIs
export const gamePaused = writable(false);

let _paused = false;
gamePaused.subscribe(v => { _paused = v; });

// tick every second when not paused
function _tick() {
	if (!_paused) timer.update(n => n + 1);
}

const _interval = setInterval(_tick, 1000);

export function pauseGame() { gamePaused.set(true); }
export function resumeGame() { gamePaused.set(false); }

export function resetTimer() { timer.set(0); }

// interval intentionally left running for dev server lifetime
