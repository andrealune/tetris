import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  EMPTY_CELL,
  Board,
  createEmptyBoard,
  clearBoard,
  resetBoard,
  isInBounds,
  getCell,
  setCell,
  isCellEmpty,
  exportBoard,
  serializeBoard,
  deserializeBoard,
} from './board';

describe('createEmptyBoard', () => {
  it('creates a board with the default 10x20 dimensions', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_HEIGHT);
    for (const row of board) {
      expect(row).toHaveLength(BOARD_WIDTH);
    }
  });

  it('initializes every cell to EMPTY_CELL', () => {
    const board = createEmptyBoard();
    for (const row of board) {
      for (const cell of row) {
        expect(cell).toBe(EMPTY_CELL);
      }
    }
  });

  it('supports custom dimensions', () => {
    const board = createEmptyBoard(5, 3);
    expect(board).toHaveLength(3);
    expect(board[0]).toHaveLength(5);
  });

  it('rejects non-positive or non-integer dimensions', () => {
    expect(() => createEmptyBoard(0, 20)).toThrow(RangeError);
    expect(() => createEmptyBoard(10, 0)).toThrow(RangeError);
    expect(() => createEmptyBoard(-1, 20)).toThrow(RangeError);
    expect(() => createEmptyBoard(10, 1.5)).toThrow(RangeError);
  });

  it('produces independent rows (mutating one row does not affect others)', () => {
    const board = createEmptyBoard();
    board[0][0] = 7;
    expect(board[1][0]).toBe(EMPTY_CELL);
  });
});

describe('clearBoard', () => {
  it('sets every cell back to EMPTY_CELL', () => {
    const board = createEmptyBoard();
    board[0][0] = 3;
    board[19][9] = 5;

    clearBoard(board);

    for (const row of board) {
      for (const cell of row) {
        expect(cell).toBe(EMPTY_CELL);
      }
    }
  });

  it('preserves the board dimensions', () => {
    const board = createEmptyBoard();
    clearBoard(board);
    expect(board).toHaveLength(BOARD_HEIGHT);
    expect(board[0]).toHaveLength(BOARD_WIDTH);
  });

  it('returns the same board instance', () => {
    const board = createEmptyBoard();
    expect(clearBoard(board)).toBe(board);
  });
});

describe('resetBoard', () => {
  it('behaves like clearBoard', () => {
    const board = createEmptyBoard();
    board[10][5] = 2;
    resetBoard(board);
    expect(board[10][5]).toBe(EMPTY_CELL);
  });
});

describe('isInBounds', () => {
  const board = createEmptyBoard();

  it('is true for valid coordinates', () => {
    expect(isInBounds(board, 0, 0)).toBe(true);
    expect(isInBounds(board, BOARD_HEIGHT - 1, BOARD_WIDTH - 1)).toBe(true);
  });

  it('is false for out-of-range coordinates', () => {
    expect(isInBounds(board, -1, 0)).toBe(false);
    expect(isInBounds(board, 0, -1)).toBe(false);
    expect(isInBounds(board, BOARD_HEIGHT, 0)).toBe(false);
    expect(isInBounds(board, 0, BOARD_WIDTH)).toBe(false);
  });
});

describe('getCell / setCell', () => {
  it('gets and sets a value at a valid coordinate', () => {
    const board = createEmptyBoard();
    setCell(board, 4, 2, 6);
    expect(getCell(board, 4, 2)).toBe(6);
  });

  it('throws a RangeError for out-of-bounds get', () => {
    const board = createEmptyBoard();
    expect(() => getCell(board, -1, 0)).toThrow(RangeError);
    expect(() => getCell(board, 0, BOARD_WIDTH)).toThrow(RangeError);
  });

  it('throws a RangeError for out-of-bounds set', () => {
    const board = createEmptyBoard();
    expect(() => setCell(board, BOARD_HEIGHT, 0, 1)).toThrow(RangeError);
    expect(() => setCell(board, 0, -1, 1)).toThrow(RangeError);
  });
});

describe('isCellEmpty', () => {
  it('returns true for untouched cells', () => {
    const board = createEmptyBoard();
    expect(isCellEmpty(board, 0, 0)).toBe(true);
  });

  it('returns false after placing a tetromino id', () => {
    const board = createEmptyBoard();
    setCell(board, 0, 0, 1);
    expect(isCellEmpty(board, 0, 0)).toBe(false);
  });
});

describe('exportBoard', () => {
  it('returns a deep copy that does not alias the original', () => {
    const board = createEmptyBoard();
    setCell(board, 0, 0, 4);

    const exported = exportBoard(board);
    expect(exported).toEqual(board);

    exported[0][0] = 99;
    expect(board[0][0]).toBe(4);

    exported.push([]);
    expect(board).toHaveLength(BOARD_HEIGHT);
  });
});

describe('serializeBoard / deserializeBoard', () => {
  it('round-trips a board through serialization', () => {
    const board = createEmptyBoard();
    setCell(board, 1, 1, 7);

    const serialized = serializeBoard(board);
    const restored = deserializeBoard(serialized);

    expect(restored).toEqual(board);
  });

  it('rejects malformed serialized input', () => {
    expect(() => deserializeBoard('{"not":"a board"}')).toThrow(TypeError);
    expect(() => deserializeBoard('[[1, "x"]]')).toThrow(TypeError);
    expect(() => deserializeBoard('[1, 2, 3]')).toThrow(TypeError);
  });
});

describe('board typing', () => {
  it('exposes a Board type usable by consumers', () => {
    const board: Board = createEmptyBoard();
    expect(Array.isArray(board)).toBe(true);
  });
});
