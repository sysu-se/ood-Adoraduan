/**
 * Sudoku - domain model for a Sudoku board.
 * Represents a 9x9 grid of numbers where 0 indicates an empty cell.
 */
class Sudoku {
    /**
     * Create a Sudoku instance.
     * @param {number[][]} grid - 9x9 array of integers (0-9).
     * @throws {TypeError} if grid is not a valid 9x9 numeric array.
     */
    constructor(grid) {
        if (!Array.isArray(grid) || grid.length !== 9 || !grid.every(r => Array.isArray(r) && r.length === 9)) {
            throw new TypeError('Sudoku constructor requires a 9x9 grid array');
        }
        // validate values are integers 0..9
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const v = grid[r][c];
                if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 9) {
                    throw new TypeError('Grid values must be integers in range 0..9');
                }
            }
        }

        // Deep-copy input grid to isolate internal state
        this.grid = grid.map(row => [...row]);
    }

    /**
     * Get a deep copy of the current grid.
     * @returns {number[][]} 9x9 array copy
     */
    getGrid() {
        return this.grid.map(row => [...row]);
    }

    /**
     * Apply a move to the grid.
     * @param {{row:number, col:number, value:number}} move - 0-based row/col and value (0..9)
     * @throws {TypeError|RangeError} on invalid input
     */
    guess(move) {
        if (!move || typeof move !== 'object') throw new TypeError('move must be an object {row,col,value}');
        const { row, col, value } = move;
        if (typeof row !== 'number' || typeof col !== 'number' || typeof value !== 'number') {
            throw new TypeError('move.row, move.col and move.value must be numbers');
        }
        if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 8 || col < 0 || col > 8) {
            throw new RangeError('move.row and move.col must be integers in range 0..8');
        }
        if (!Number.isInteger(value) || value < 0 || value > 9) {
            throw new RangeError('move.value must be an integer in range 0..9');
        }

        this.grid[row][col] = value;
    }

    /**
     * Create a deep copy of this Sudoku instance.
     * @returns {Sudoku}
     */
    clone() {
        return new Sudoku(this.grid);
    }

    /**
     * Serialize to a plain object suitable for JSON.
     * @returns {{grid:number[][]}}
     */
    toJSON() {
        return { grid: this.getGrid() };
    }

    /**
     * String representation for inspection.
     * @returns {string}
     */
    toString() {
        return this.grid.map(row => row.join(' ')).join('\n');
    }
}




/**
 * Game - represents a single Sudoku game instance with undo/redo history.
 */
class Game {
    /**
     * @param {Sudoku} sudoku - initial Sudoku instance (will be used as current state)
     */
    constructor(sudoku) {
        this.history = [];
        this.future = [];
        this.current = sudoku;
        // 探索模式：使用独立的 history 链，与主 history 完全隔离
        this.exploreHistory = [];
        this.exploreFuture = [];
        this.exploreSnapshot = null;
        this.exploring = false;
    }

    /**
     * Get the current Sudoku instance.
     * @returns {Sudoku}
     */
    getSudoku() { return this.current; }

    /**
     * Apply a move and record it for undo/redo.
     * 如果在探索模式下，操作记录到 exploreHistory/exploreFuture 中
     * @param {{row:number, col:number, value:number}} move
     */
    guess(move) {
        const { row, col } = move;
        if (this.exploring) {
            this.exploreHistory.push({ row: row, col: col, value: this.current.grid[row][col] });
            this.current.guess(move);
            this.exploreFuture = [];
        } else {
            this.history.push({ row: row, col: col, value: this.current.grid[row][col] });
            this.current.guess(move);
            this.future = [];
        }
    }

    /**
     * Undo last move if available.
     * 如果在探索模式下，从 exploreHistory 中撤销
     */
    undo() {
        if (this.exploring) {
            if (this.exploreHistory.length === 0) return;
            const { row, col, value } = this.exploreHistory[this.exploreHistory.length - 1];
            this.exploreFuture.push({ row, col, value: this.current.grid[row][col] });
            this.current.guess({ row, col, value });
            this.exploreHistory.pop();
        } else {
            if (this.canUndo() === false) return;
            const { row, col, value } = this.history[this.history.length - 1];
            this.future.push({ row, col, value: this.current.grid[row][col] });
            this.current.guess({ row, col, value });
            this.history.pop();
        }
    }

    /**
     * Redo previously undone move if available.
     * 如果在探索模式下，从 exploreFuture 中重做
     */
    redo() {
        if (this.exploring) {
            if (this.exploreFuture.length === 0) return;
            const { row, col, value } = this.exploreFuture[this.exploreFuture.length - 1];
            this.exploreHistory.push({ row, col, value: this.current.grid[row][col] });
            this.current.guess({ row, col, value });
            this.exploreFuture.pop();
        } else {
            if (this.canRedo() === false) return;
            const { row, col, value } = this.future[this.future.length - 1];
            this.history.push({ row, col, value: this.current.grid[row][col] });
            this.current.guess({ row, col, value });
            this.future.pop();
        }
    }

    /**
     * Whether undo is possible.
     * @returns {boolean}
     */
    canUndo() {
        if (this.exploring) return this.exploreHistory.length > 0;
        return this.history.length > 0;
    }

    /**
     * Whether redo is possible.
     * @returns {boolean}
     */
    canRedo() {
        if (this.exploring) return this.exploreFuture.length > 0;
        return this.future.length > 0;
    }

    /**
     * 全盘检测：检查是否有格子没有任何候选数（探索失败）
     * 返回失败格子的坐标数组 [{row, col}, ...]，如果没有失败格子返回空数组
     */
    checkExploreFailed() {
        const failedCells = [];
        const grid = this.current.grid;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (grid[r][c] !== 0) continue;
                const blockers = new Set();
                for (let i = 0; i < 9; i++) {
                    if (i !== c && grid[r][i] !== 0) blockers.add(grid[r][i]);
                }
                for (let i = 0; i < 9; i++) {
                    if (i !== r && grid[i][c] !== 0) blockers.add(grid[i][c]);
                }
                const br = Math.floor(r / 3) * 3;
                const bc = Math.floor(c / 3) * 3;
                for (let rr = br; rr < br + 3; rr++) {
                    for (let cc = bc; cc < bc + 3; cc++) {
                        if (rr === r && cc === c) continue;
                        if (grid[rr][cc] !== 0) blockers.add(grid[rr][cc]);
                    }
                }
                if (blockers.size >= 9) {
                    failedCells.push({ row: r, col: c });
                }
            }
        }
        return failedCells;
    }

    /**
     * 进入探索模式：保存当前棋盘快照，清空探索历史
     */
    enterExploreMode() {
        if (this.exploring) return;
        this.exploring = true;
        this.exploreSnapshot = this.current.clone();
        this.exploreHistory = [];
        this.exploreFuture = [];
    }

    /**
     * 撤销探索：恢复到进入探索模式时的棋盘状态，清空探索历史
     */
    undoExplore() {
        if (!this.exploring) return;
        this.current = this.exploreSnapshot;
        this.exploreHistory = [];
        this.exploreFuture = [];
        this.exploreSnapshot = null;
        this.exploring = false;
    }

    /**
     * 应用探索：将探索模式下的操作按顺序合并到主 history 中
     */
    applyExplore() {
        if (!this.exploring) return;
        for (const move of this.exploreHistory) {
            this.history.push(move);
        }
        this.future = [];
        this.exploreHistory = [];
        this.exploreFuture = [];
        this.exploreSnapshot = null;
        this.exploring = false;
    }

    /**
     * 是否处于探索模式
     * @returns {boolean}
     */
    isExploring() { return this.exploring; }

    /**
     * 获取探索历史中修改过的格子坐标列表
     * @returns {Array<{row:number, col:number}>}
     */
    getExploreCells() {
        if (!this.exploring) return [];
        return this.exploreHistory.map(m => ({ row: m.row, col: m.col }));
    }

    /**
     * Serialize game state (includes current sudoku JSON).
     */
    toJSON() { return { sudoku: this.current.toJSON() }; }

    /**
     * 提示函数
     * Compute hint state for the current board.
     * This is a pure function that analyses the current grid and returns
     * a 9x9 array of hint objects. It accepts the initialGrid (givens) so
     * the domain layer remains pure and does not rely on external stores.
     *
     * Hint object shape per cell:
     * - { type: 'given' } for given cells
     * - { type: 'conflict' } for non-given cells that conflict with peers
     * - { type: 'filled', value } for non-empty non-conflict non-given
     * - { type: 'single', value } for empty cell with exactly one candidate
     * - { type: 'few', candidates } for 2-3 candidates
     * - { type: 'many', candidates } for 4+ candidates (UI may only show min)
     * - { type: 'empty' } for an empty cell with no candidates
     *
     * Behavior per spec:
     * - First mark non-given filled cells that conflict with any peer as 'conflict'.
     * - When computing candidates for empty, non-conflict cells, ignore numbers placed in conflict cells
     *   (i.e. treat conflict cells as empty when eliminating candidates).
     *
     * @param {number[][]} initialGrid - 9x9 grid describing givens (0 = not given)
     * @returns {Array<Array<Object>>} 9x9 array of hint objects
     */
    computeHints(initialGrid) {
        // helper to clone empty 9x9
        const make2D = (v = null) => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => v));

        const grid = this.current.getGrid();
        const isGiven = (r, c) => !!(initialGrid && initialGrid[r] && initialGrid[r][c]);

        // compute peers utility
        const peersOf = (r, c) => {
            const peers = [];
            for (let i = 0; i < 9; i++) {
                if (i !== c) peers.push([r, i]); // same row
                if (i !== r) peers.push([i, c]); // same col
            }
            const br = Math.floor(r / 3) * 3;
            const bc = Math.floor(c / 3) * 3;
            for (let rr = br; rr < br + 3; rr++) {
                for (let cc = bc; cc < bc + 3; cc++) {
                    if (rr === r && cc === c) continue;
                    // avoid duplicates (row/col already recorded) - we'll dedupe by string
                    peers.push([rr, cc]);
                }
            }
            // dedupe
            const seen = new Set();
            const dedup = [];
            for (const [rr, cc] of peers) {
                const k = rr + ',' + cc;
                if (!seen.has(k)) { seen.add(k); dedup.push([rr, cc]); }
            }
            return dedup;
        };

        // Step 1: identify conflict cells (red) - only non-given filled cells can be marked conflict
        const conflict = make2D(false);
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const v = grid[r][c];
                if (v === 0) continue;
                if (isGiven(r, c)) continue; // givens are never marked red per spec
                const peers = peersOf(r, c);
                for (const [pr, pc] of peers) {
                    if (grid[pr][pc] === v) {
                        // if peer shares same value, mark this non-given cell as conflict
                        conflict[r][c] = true;
                        // also mark peer if it is non-given
                        if (!isGiven(pr, pc)) conflict[pr][pc] = true;
                    }
                }
            }
        }

        // Step 2: compute candidates for empty, non-conflict cells; ignore numbers in conflict cells
        const hints = make2D(null);

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (isGiven(r, c)) { hints[r][c] = { type: 'given' }; continue; }
                const v = grid[r][c];
                if (v !== 0) {
                    if (conflict[r][c]) { hints[r][c] = { type: 'conflict', value: v }; }
                    else { hints[r][c] = { type: 'filled', value: v }; }
                    continue;
                }

                // empty cell
                // gather blocking numbers from peers, but ignore numbers that occur in conflict cells
                const blockers = new Set();
                const peers = peersOf(r, c);
                for (const [pr, pc] of peers) {
                    const pv = grid[pr][pc];
                    if (pv === 0) continue;
                    if (conflict[pr][pc]) continue; // ignore red cells
                    blockers.add(pv);
                }

                const candidates = [];
                for (let d = 1; d <= 9; d++) {
                    if (!blockers.has(d)) candidates.push(d);
                }

                if (candidates.length === 0) {
                    hints[r][c] = { type: 'empty', candidates: [] };
                } else if (candidates.length === 1) {
                    hints[r][c] = { type: 'single', value: candidates[0], candidates };
                } else if (candidates.length <= 3) {
                    hints[r][c] = { type: 'few', candidates };
                } else {
                    hints[r][c] = { type: 'many', candidates };
                }
            }
        }

        return hints;
    }
}

// 工厂函数：从二维数组创建 Sudoku
export function createSudoku(input) {
    return new Sudoku(input);
}

export function createSudokuFromJSON(json) {
    // json 应该是一个对象，包含 grid 属性
    return new Sudoku(json.grid);
}

// sudoku返回创造Game
export function createGame({ sudoku }) {
    return new Game(sudoku)
}

export function createGameFromJSON(json) {
    // json型sudoku返回创造Game
    return createGame({ sudoku: createSudokuFromJSON(json.sudoku) });
}
