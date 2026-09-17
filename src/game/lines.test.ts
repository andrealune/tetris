import { Board, BOARD_HEIGHT, BOARD_WIDTH, EMPTY_CELL, createEmptyBoard } from './board';
import {
  MARKED_FOR_CLEAR,
  isRowFull,
  findFullLines,
  markLinesForClear,
  clearLines,
} from './lines';

/** Fills every cell in the given row of `board` with `value`. */
function fillRow(board: Board, row: number, value: number = 1): void {
  for (let col = 0; col < board[row].length; col++) {
    board[row][col] = value;
  }
}

describe('isRowFull', () => {
  it('returns false for an empty row', () => {
    const board = createEmptyBoard();
    expect(isRowFull(board[0])).toBe(false);
  });

  it('returns false when only some cells are filled', () => {
    const board = createEmptyBoard();
    board[0][0] = 1;
    board[0][1] = 2;
    expect(isRowFull(board[0])).toBe(false);
  });

  it('returns true when every cell is filled', () => {
    const board = createEmptyBoard();
    fillRow(board, 0, 3);
    expect(isRowFull(board[0])).toBe(true);
  });

  it('returns false for an empty (zero-length) row', () => {
    expect(isRowFull([])).toBe(false);
  });
});

describe('findFullLines', () => {
  it('returns an empty array when no lines are full', () => {
    const board = createEmptyBoard();
    board[5][0] = 1;
    expect(findFullLines(board)).toEqual([]);
  });

  it('finds a single full line', () => {
    const board = createEmptyBoard();
    fillRow(board, 19);
    expect(findFullLines(board)).toEqual([19]);
  });

  it('finds multiple simultaneous full lines in ascending order', () => {
    const board = createEmptyBoard();
    fillRow(board, 15);
    fillRow(board, 3);
    fillRow(board, 19);
    expect(findFullLines(board)).toEqual([3, 15, 19]);
  });

  it('does not mutate the board', () => {
    const board = createEmptyBoard();
    fillRow(board, 10);
    const before = board.map((row) => [...row]);
    findFullLines(board);
    expect(board).toEqual(before);
  });

  it('treats a row with a zero-valued (empty) cell as not full', () => {
    const board = createEmptyBoard();
    fillRow(board, 0);
    board[0][4] = EMPTY_CELL;
    expect(findFullLines(board)).toEqual([]);
  });
});

describe('markLinesForClear', () => {
  it('replaces every cell in the given rows with MARKED_FOR_CLEAR', () => {
    const board = createEmptyBoard();
    fillRow(board, 5, 7);

    const marked = markLinesForClear(board, [5]);

    for (const cell of marked[5]) {
      expect(cell).toBe(MARKED_FOR_CLEAR);
    }
  });

  it('leaves unmarked rows untouched', () => {
    const board = createEmptyBoard();
    fillRow(board, 5, 7);
    fillRow(board, 6, 9);

    const marked = markLinesForClear(board, [5]);

    expect(marked[6]).toEqual(board[6]);
  });

  it('does not mutate the original board', () => {
    const board = createEmptyBoard();
    fillRow(board, 5, 7);

    markLinesForClear(board, [5]);

    expect(board[5].every((cell) => cell === 7)).toBe(true);
  });

  it('supports marking multiple lines at once', () => {
    const board = createEmptyBoard();
    fillRow(board, 2, 1);
    fillRow(board, 8, 1);

    const marked = markLinesForClear(board, [2, 8]);

    expect(marked[2].every((cell) => cell === MARKED_FOR_CLEAR)).toBe(true);
    expect(marked[8].every((cell) => cell === MARKED_FOR_CLEAR)).toBe(true);
  });

  it('throws a RangeError for an out-of-bounds line index', () => {
    const board = createEmptyBoard();
    expect(() => markLinesForClear(board, [-1])).toThrow(RangeError);
    expect(() => markLinesForClear(board, [BOARD_HEIGHT])).toThrow(RangeError);
  });
});

describe('clearLines', () => {
  it('returns zero cleared lines and leaves the board untouched when nothing is full', () => {
    const board = createEmptyBoard();
    board[10][0] = 4;

    const result = clearLines(board);

    expect(result).toEqual({ clearedLines: [], linesCleared: 0 });
    expect(board[10][0]).toBe(4);
  });

  it('removes a single full line and reports it', () => {
    const board = createEmptyBoard();
    fillRow(board, 19, 5);

    const result = clearLines(board);

    expect(result.linesCleared).toBe(1);
    expect(result.clearedLines).toEqual([19]);
    expect(board).toHaveLength(BOARD_HEIGHT);
    // The row that was full is gone; a fresh empty row appears at the top.
    for (const cell of board[0]) {
      expect(cell).toBe(EMPTY_CELL);
    }
  });

  it('applies gravity so rows above the cleared line shift down', () => {
    const board = createEmptyBoard();
    board[18][0] = 9; // a single block sitting just above the line to clear
    fillRow(board, 19, 5);

    clearLines(board);

    // The block that was on row 18 should now have fallen to row 19.
    expect(board[19][0]).toBe(9);
    for (let col = 1; col < BOARD_WIDTH; col++) {
      expect(board[19][col]).toBe(EMPTY_CELL);
    }
  });

  it('handles multiple simultaneous line clears, shifting non-adjacent rows correctly', () => {
    const board = createEmptyBoard();
    board[0][0] = 1; // marker to track through the gravity shift
    fillRow(board, 5, 2);
    fillRow(board, 10, 3);
    fillRow(board, 19, 4);

    const result = clearLines(board);

    expect(result.linesCleared).toBe(3);
    expect(result.clearedLines).toEqual([5, 10, 19]);
    expect(board).toHaveLength(BOARD_HEIGHT);

    // Three new empty rows should have been inserted at the top, and
    // the original row 0 marker should now be three rows further down.
    expect(board[0].every((cell) => cell === EMPTY_CELL)).toBe(true);
    expect(board[1].every((cell) => cell === EMPTY_CELL)).toBe(true);
    expect(board[2].every((cell) => cell === EMPTY_CELL)).toBe(true);
    expect(board[3][0]).toBe(1);
  });

  it('clears every row when the whole board is full (e.g. a full-board Tetris)', () => {
    const board = createEmptyBoard();
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      fillRow(board, row, 1);
    }

    const result = clearLines(board);

    expect(result.linesCleared).toBe(BOARD_HEIGHT);
    for (const row of board) {
      for (const cell of row) {
        expect(cell).toBe(EMPTY_CELL);
      }
    }
  });

  it('preserves board width when clearing lines', () => {
    const board = createEmptyBoard();
    fillRow(board, 19, 1);

    clearLines(board);

    for (const row of board) {
      expect(row).toHaveLength(BOARD_WIDTH);
    }
  });

  it('mutates the board in place, keeping the same outer array reference usable', () => {
    const board = createEmptyBoard();
    fillRow(board, 19, 1);

    const rowsBefore = board;
    clearLines(board);

    expect(board).toBe(rowsBefore);
  });

  it('leaves cells of partially-filled rows untouched relative to each other', () => {
    const board = createEmptyBoard();
    board[17][3] = 6;
    board[18][7] = 8;
    fillRow(board, 19, 1);

    clearLines(board);

    expect(board[18][3]).toBe(6);
    expect(board[19][7]).toBe(8);
  });
});
