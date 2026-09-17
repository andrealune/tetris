import { BOARD_WIDTH, createEmptyBoard, setCell } from './board';
import { ActivePiece, canSpawn, getSpawnPosition, spawnPiece, trySpawnPiece } from './spawn';
import { getTetrominoHeight, getTetrominoId, getTetrominoWidth, TETROMINO_TYPES, TetrominoType } from './tetromino';

describe('getSpawnPosition', () => {
  it('spawns every piece at row 0 (the top of the board)', () => {
    for (const type of TETROMINO_TYPES) {
      expect(getSpawnPosition(type).row).toBe(0);
    }
  });

  it('horizontally centers each piece on a 10-wide board', () => {
    expect(getSpawnPosition(TetrominoType.I, 10).col).toBe(3); // cols 3-6
    expect(getSpawnPosition(TetrominoType.O, 10).col).toBe(4); // cols 4-5
    expect(getSpawnPosition(TetrominoType.T, 10).col).toBe(3); // cols 3-5
  });

  it('adapts to a different board width', () => {
    expect(getSpawnPosition(TetrominoType.O, 8).col).toBe(3);
  });
});

describe('spawnPiece', () => {
  it('produces a piece with the correct type and board-cell id', () => {
    for (const type of TETROMINO_TYPES) {
      const piece = spawnPiece(type, BOARD_WIDTH);
      expect(piece.type).toBe(type);
      expect(piece.id).toBe(getTetrominoId(type));
    }
  });

  it('produces exactly four absolute cells, matching the shape footprint', () => {
    for (const type of TETROMINO_TYPES) {
      const piece = spawnPiece(type, BOARD_WIDTH);
      expect(piece.cells).toHaveLength(4);

      const rows = piece.cells.map((c) => c.row);
      const cols = piece.cells.map((c) => c.col);
      expect(Math.max(...rows) - Math.min(...rows) + 1).toBe(getTetrominoHeight(type));
      expect(Math.max(...cols) - Math.min(...cols) + 1).toBe(getTetrominoWidth(type));
    }
  });

  it('places every cell within the board bounds for a standard board', () => {
    for (const type of TETROMINO_TYPES) {
      const piece = spawnPiece(type, BOARD_WIDTH);
      for (const cell of piece.cells) {
        expect(cell.row).toBeGreaterThanOrEqual(0);
        expect(cell.col).toBeGreaterThanOrEqual(0);
        expect(cell.col).toBeLessThan(BOARD_WIDTH);
      }
    }
  });
});

describe('canSpawn', () => {
  it('is true for every piece on a fresh, empty board', () => {
    const board = createEmptyBoard();
    for (const type of TETROMINO_TYPES) {
      expect(canSpawn(board, spawnPiece(type, BOARD_WIDTH))).toBe(true);
    }
  });

  it('is false when the spawn location is already occupied', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = spawnPiece(TetrominoType.T, BOARD_WIDTH);
    setCell(board, piece.cells[0].row, piece.cells[0].col, 9);

    expect(canSpawn(board, piece)).toBe(false);
  });

  it('is false when any spawn cell would be out of bounds', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = {
      type: TetrominoType.O,
      id: getTetrominoId(TetrominoType.O),
      row: -1,
      col: 0,
      cells: [
        { row: -1, col: 0 },
        { row: -1, col: 1 },
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
    };

    expect(canSpawn(board, piece)).toBe(false);
  });
});

describe('trySpawnPiece', () => {
  it('reports blocked: false and returns a usable piece on an empty board', () => {
    const board = createEmptyBoard();
    const { piece, blocked } = trySpawnPiece(board, TetrominoType.I);

    expect(blocked).toBe(false);
    expect(piece.type).toBe(TetrominoType.I);
  });

  it('reports blocked: true when the top of the board is already filled (top-out)', () => {
    const board = createEmptyBoard();
    for (let col = 0; col < BOARD_WIDTH; col++) {
      setCell(board, 0, col, 1);
    }

    const { blocked } = trySpawnPiece(board, TetrominoType.O);
    expect(blocked).toBe(true);
  });

  it('sizes the spawn to the board actually passed in, not the default width', () => {
    const narrowBoard = createEmptyBoard(6, 20);
    const { piece } = trySpawnPiece(narrowBoard, TetrominoType.O);
    expect(piece.col).toBe(2); // (6 - 2) / 2
  });
});
