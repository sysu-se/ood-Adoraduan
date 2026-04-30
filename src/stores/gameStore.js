// src/stores/gameStore.js
import { writable } from 'svelte/store';
import { createGame, createSudokuFromJSON } from '../domain/index.js';
import { cursor as legacyCursor } from './legacy/cursor';
import { settings as settingsStore } from './legacy/settings';
import { get as getStore } from 'svelte/store';

// 内置一个经典数独题目（确保有数字）
const DEFAULT_GRID = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
];

function createGameStore() {
    // 在 createGameStore 内部添加
        // 将旧的二维 grid 同步到 gameStore 中，外部（例如旧的 grid store）可以调用
        function syncFromLegacyGrid(legacyGrid) {
            const sudoku = createSudokuFromJSON({ grid: legacyGrid });
            // capture initial (given) grid
            initialGrid = sudoku.getGrid();
            game = createGame({ sudoku });
            refresh();
        }
    // 直接用默认网格创建 Sudoku 和 Game
    let sudokuInstance = createSudokuFromJSON({ grid: DEFAULT_GRID });
    let initialGrid = sudokuInstance.getGrid();
    let game = createGame({ sudoku: sudokuInstance });

    const { subscribe, set } = writable({
        grid: game.getSudoku().getGrid(),
        initialGrid,
        canUndo: game.canUndo(),
        canRedo: game.canRedo(),
        hints: null,
        exploring: game.isExploring(),
        exploreCells: game.getExploreCells()
    });

    function refresh() {
        set({
            grid: game.getSudoku().getGrid(),
            initialGrid,
            canUndo: game.canUndo(),
            canRedo: game.canRedo(),
            hints: null,
            exploring: game.isExploring(),
            exploreCells: game.getExploreCells()
        });
    }

    function hint() {
        // clear any current cursor selection (per spec: cancel selection)
        legacyCursor.set(null, null);

        // check settings for hints limit
        const settings = getStore(settingsStore) || {};
        if (settings.hintsLimited) {
            const remaining = typeof settings.hints === 'number' ? settings.hints : 0;
            if (remaining <= 0) {
                console.info('[gameStore] no hint remaining');
                return null;
            }
            // decrement and persist
            settings.hints = Math.max(0, remaining - 1);
            settingsStore.set(settings);
        }

        // compute hints using domain API (Game.computeHints)
        try {
            console.log('[gameStore] computing hints, remaining after decrement:', getStore(settingsStore).hints);
            const hints = game.computeHints(initialGrid);
            console.log('[gameStore] computeHints result sample:', hints && hints[0] && hints[0][0]);
            set({ grid: game.getSudoku().getGrid(), initialGrid, canUndo: game.canUndo(), canRedo: game.canRedo(), hints, exploring: game.isExploring(), exploreCells: game.getExploreCells() });
            return hints;
        } catch (err) {
            console.error('[gameStore] hint() failed', err);
            return null;
        }
    }

    function clearHints() {
        set({ grid: game.getSudoku().getGrid(), initialGrid, canUndo: game.canUndo(), canRedo: game.canRedo(), hints: null, exploring: game.isExploring(), exploreCells: game.getExploreCells() });
    }

    function guess(row, col, value) {
        // prevent changing initial given cells
        if (initialGrid && initialGrid[row] && initialGrid[row][col] && initialGrid[row][col] !== 0) {
            console.warn('[gameStore] attempt to modify initial given cell ignored', { row, col });
            return false;
        }

        game.guess({ row, col, value });

        // 探索模式下：执行全盘检测
        if (game.isExploring()) {
            const failedCells = game.checkExploreFailed();
            if (failedCells.length > 0) {
                set({
                    grid: game.getSudoku().getGrid(),
                    initialGrid,
                    canUndo: game.canUndo(),
                    canRedo: game.canRedo(),
                    hints: null,
                    exploring: true,
                    exploreCells: game.getExploreCells()
                });
                return { failed: true, failedCells };
            }
        }

        refresh();
        return true;
    }

    function undo() {
        game.undo();
        refresh();
    }

    function redo() {
        game.redo();
        refresh();
    }

    // 新游戏：接受一个网格（二维数组），或者接受 sencode（忽略，只使用网格）
    function newGame(gridOrSencode) {
        let grid;
        if (Array.isArray(gridOrSencode) && gridOrSencode.length === 9) {
            grid = gridOrSencode;
        } else {
            // 如果不是网格，使用默认网格
            grid = DEFAULT_GRID;
        }
        const sudoku = createSudokuFromJSON({ grid });
        // capture initial givens
        initialGrid = sudoku.getGrid();
        game = createGame({ sudoku });
        refresh();
    }

    // === 探索模式相关方法 ===
    function enterExploreMode() {
        game.enterExploreMode();
        refresh();
    }

    function undoExplore() {
        game.undoExplore();
        refresh();
    }

    function applyExplore() {
        game.applyExplore();
        refresh();
    }

    function isExploring() {
        return game.isExploring();
    }

    return {
        subscribe,
        hint,
        clearHints,
        guess,
        undo,
        redo,
        newGame,
        syncFromLegacyGrid,
        getSudoku: () => game.getSudoku(),
        // 探索模式
        enterExploreMode,
        undoExplore,
        applyExplore,
        isExploring
    };
}

export const gameStore = createGameStore();
