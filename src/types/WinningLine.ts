export type WinningLine = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  cells: [number, number][];
};