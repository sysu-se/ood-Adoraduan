import { gameStore } from '../../stores/gameStore';
import generator from 'fake-sudoku-puzzle-generator';
import { writable } from 'svelte/store';
import { resetTimer } from './timer';

export const paused = writable(false);

function generateByDifficulty(diff) {
  // fake generator accepts difficulty labels like 'easy','medium','hard'
  try {
    const puzzle = generator.generate({ difficulty: diff });
    // ensure we return a 9x9 grid of numbers
    return puzzle.grid || puzzle;
  } catch (e) {
    // fallback: ask gameStore to keep default
    return null;
  }
}

const FALLBACK_PUZZLES = [
  // a couple of alternative puzzles
  [
    [0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],[8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],[0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]
  ],
  [
    [2,0,0,6,0,8,0,0,5],[0,0,0,0,0,0,3,0,0],[0,7,4,0,0,0,0,6,0],[0,0,0,0,0,1,0,0,0],[0,0,0,8,0,3,0,0,0],[0,0,0,0,2,0,0,0,0],[0,6,0,0,0,0,0,2,0],[0,0,3,0,0,0,0,0,0],[9,0,0,2,0,6,0,0,1]
  ]
];

// --- Internal generator + solver fallback ---
// Simple backtracking solver that can count solutions up to a limit.
function cloneGrid(g) {
  return g.map(r => r.slice());
}

function findEmpty(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!grid[r][c]) return [r, c];
    }
  }
  return null;
}

function isValidPlacement(grid, row, col, val) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === val) return false;
    if (grid[i][col] === val) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === val) return false;
    }
  }
  return true;
}

function solveCount(grid, limit = 2) {
  // returns number of solutions up to limit
  const g = cloneGrid(grid);
  let count = 0;

  function backtrack() {
    if (count >= limit) return;
    const pos = findEmpty(g);
    if (!pos) {
      count++;
      return;
    }
    const [r, c] = pos;
    for (let v = 1; v <= 9; v++) {
      if (isValidPlacement(g, r, c, v)) {
        g[r][c] = v;
        backtrack();
        g[r][c] = 0;
        if (count >= limit) return;
      }
    }
  }

  backtrack();
  return count;
}

function generateFullSolution() {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

  // fill with backtracking using random order for numbers
  function backfill() {
    const pos = findEmpty(grid);
    if (!pos) return true;
    const [r, c] = pos;
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    for (const n of nums) {
      if (isValidPlacement(grid, r, c, n)) {
        grid[r][c] = n;
        if (backfill()) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  backfill();
  return grid;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function generatePuzzleByClues(difficulty) {
  // difficulty -> target clues range
  let minClues = 28, maxClues = 31;
  if (difficulty === 'easy') { minClues = 36; maxClues = 49; }
  else if (difficulty === 'medium') { minClues = 32; maxClues = 35; }
  else if (difficulty === 'hard') { minClues = 28; maxClues = 31; }
  const targetClues = Math.floor(Math.random() * (maxClues - minClues + 1)) + minClues;

  const solution = generateFullSolution();
  const puzzle = cloneGrid(solution);

  // list of cell coordinates
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r,c]);
  shuffleArray(cells);

  let filled = 81;
  const maxAttempts = 5000;
  let attempts = 0;
  for (let i = 0; i < cells.length && filled > targetClues && attempts < maxAttempts; i++) {
    attempts++;
    const [r,c] = cells[i];
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    const sols = solveCount(puzzle, 2);
    if (sols === 1) {
      filled--;
    } else {
      // revert if removal caused multiple solutions or unsolvable
      puzzle[r][c] = backup;
    }
    // when reached end, reshuffle and continue attempts if still above target
    if (i === cells.length - 1 && filled > targetClues && attempts < maxAttempts) {
      shuffleArray(cells);
      i = -1; // loop will increment to 0
    }
  }

  return puzzle;
}

// expose helpers for testing
export { generatePuzzleByClues, solveCount };


export default {
  pause() { paused.set(true); },
  resume() { paused.set(false); },
  startNew(difficulty) {
    let grid = generateByDifficulty(difficulty);
    if (!grid) {
      // try internal generator to produce a puzzle with desired difficulty
      try {
        grid = generatePuzzleByClues(difficulty);
      } catch (e) {
        // if internal generation fails, pick a random fallback
        grid = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
      }
    }
    gameStore.newGame(grid);
    resetTimer();
  },
  startCustom(sencode) {
    try {
      const json = JSON.parse(atob(sencode));
      if (Array.isArray(json)) {
        gameStore.newGame(json);
  resetTimer();
      }
    } catch (e) {
      // ignore invalid code
    }
  }
};
