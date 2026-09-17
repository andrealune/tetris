import { describe, it, expect } from 'vitest';
import { createEmptyBoard, BOARD_HEIGHT, BOARD_WIDTH } from '../board';
import { clearLines, findFullLines } from '../lines';

function fillRow(board: ReturnType<typeof createEmptyBoard>, row: number) {
  for (let x = 0; x < BOARD_WIDTH; x++) {
    board[row][x] = 'T';
  }
}

describe('findFullLines', () => {
  it('returns an empty array for an empty board', () => {
    const board = createEmptyBoard();
    expect(findFullLines(board)).toEqual([]);
  });

  it('finds a single completely filled row', () => {
    const board = createEmptyBoard();
    fillRow(board, 19);
    expect(findFullLines(board)).toEqual([19]);
  });

  it('finds multiple completely filled, non-adjacent rows', () => {
    const board = createEmptyBoard();
    fillRow(board, 5);
    fillRow(board, 19);
    expect(findFullLines(board)).toEqual([5, 19]);
  });

  it('does not count a row with even one empty cell', () => {
    const board = createEmptyBoard();
    fillRow(board, 19);
    board[19][0] = null;
    expect(findFullLines(board)).toEqual([]);
  });
});

describe('clearLines', () => {
  it('removes the given rows and keeps the board BOARD_HEIGHT tall', () => {
    const board = createEmptyBoard();
    fillRow(board, 19);
    const cleared = clearLines(board, [19]);
    expect(cleared.length).toBe(BOARD_HEIGHT);
    expect(cleared.every((row) => row.every((cell) => cell === null))).toBe(true);
  });

  it('shifts remaining rows down and inserts empty rows at the top', () => {
    const board = createEmptyBoard();
    board[10][3] = 'L'; // a distinguishing cell above the cleared row
    fillRow(board, 19);

    const cleared = clearLines(board, [19]);

    // The row that was at index 10 should now be at index 11 (shifted
    // down by the one row removed), and the very top row should be empty.
    expect(cleared[11][3]).toBe('L');
    expect(cleared[0].every((cell) => cell === null)).toBe(true);
    expect(cleared.length).toBe(BOARD_HEIGHT);
  });

  it('removes multiple rows at once', () => {
    const board = createEmptyBoard();
    fillRow(board, 5);
    fillRow(board, 10);
    board[0][0] = 'I';

    const cleared = clearLines(board, [5, 10]);

    expect(cleared.length).toBe(BOARD_HEIGHT);
    expect(cleared[2][0]).toBe('I'); // shifted down by 2
    expect(findFullLines(cleared)).toEqual([]);
  });

  it('is a no-op (aside from copying) when no rows are given', () => {
    const board = createEmptyBoard();
    board[0][0] = 'S';
    const cleared = clearLines(board, []);
    expect(cleared[0][0]).toBe('S');
    expect(cleared).not.toBe(board);
  });
});
