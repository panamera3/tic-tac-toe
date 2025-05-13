import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { getLottieMetadata } from "@remotion/lottie";
import gridImage from "../src/assets/grid.json"
import crossImage from "../src/assets/cross.json"
import ovalImage from "../src/assets/oval.json"
import type { Board } from "./types/Board";
import type { WinningLine } from "./types/WinningLine";
import type { CellValue } from "./types/CellValue";

export default function App() {
  const emptyBoard: Board = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const [lineLength, setLineLength] = useState<number>(0);

  const gridMetadata = getLottieMetadata(gridImage);

  const BOARD_SIZE = gridMetadata?.width ?? 192; // Размер доски для игры, в px
  const CELL_SIZE = BOARD_SIZE / 3; // Размер одной клетки, в px
  const ICON_SIZE = CELL_SIZE * 0.6; // Размер крестика/нолика, в px

  // Определение победителя
  const checkWinner = (
    board: Board
  ): { winner: CellValue | null; line: WinningLine | null } => {
    // Проверка победы по столбцам
    for (let i = 0; i < 3; i++) {
      if (
        board[i][0] &&
        board[i][0] === board[i][1] &&
        board[i][1] === board[i][2]
      ) {
        return {
          winner: board[i][0],
          line: {
            start: { x: 0, y: i * CELL_SIZE + CELL_SIZE / 2 },
            end: { x: BOARD_SIZE, y: i * CELL_SIZE + CELL_SIZE / 2 },
            cells: [
              [i, 0],
              [i, 1],
              [i, 2],
            ],
          },
        };
      }
    }
    // Проверка победы по строкам
    for (let i = 0; i < 3; i++) {
      if (
        board[0][i] &&
        board[0][i] === board[1][i] &&
        board[1][i] === board[2][i]
      ) {
        return {
          winner: board[0][i],
          line: {
            start: { x: i * CELL_SIZE + CELL_SIZE / 2, y: 0 },
            end: { x: i * CELL_SIZE + CELL_SIZE / 2, y: BOARD_SIZE },
            cells: [
              [0, i],
              [1, i],
              [2, i],
            ],
          },
        };
      }
    }
    // Проверка победы по диагонали
    if (
      board[0][0] &&
      board[0][0] === board[1][1] &&
      board[1][1] === board[2][2]
    ) {
      return {
        winner: board[0][0],
        line: {
          start: { x: 0, y: 0 },
          end: { x: BOARD_SIZE, y: BOARD_SIZE },
          cells: [
            [0, 0],
            [1, 1],
            [2, 2],
          ],
        },
      };
    }
    // Проверка победы по диагонали
    if (
      board[0][2] &&
      board[0][2] === board[1][1] &&
      board[1][1] === board[2][0]
    ) {
      return {
        winner: board[0][2],
        line: {
          start: { x: BOARD_SIZE, y: 0 },
          end: { x: 0, y: BOARD_SIZE },
          cells: [
            [0, 2],
            [1, 1],
            [2, 0],
          ],
        },
      };
    }
    return { winner: null, line: null };
  };

  // Проверка пустых клеток на доске
  const getEmptyCells = (board: Board): [number, number][] => {
    const cells: [number, number][] = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) if (!board[r][c]) cells.push([r, c]);
    return cells;
  };

  // Имитация хода ИИ
  const computerMove = (board: Board): Board => {
    const empty = getEmptyCells(board);
    if (empty.length === 0) return board;

    // Проверка всех соседних клеток
    const neighbors = (r: number, c: number): [number, number][] => {
      const deltas = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];
      return deltas
        .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
        .filter(([nr, nc]) => nr >= 0 && nr < 3 && nc >= 0 && nc < 3);
    };

    // Все пустые клетки, соседствующие с крестиками
    const possibleCellsSet = new Set<string>();

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r][c] === "X") {
          const neighs = neighbors(r, c);
          neighs.forEach(([nr, nc]) => {
            if (!board[nr][nc]) {
              possibleCellsSet.add(`${nr},${nc}`);
            }
          });
        }
      }
    }

    let possibleCells: [number, number][] = [];

    if (possibleCellsSet.size > 0) {
      possibleCells = Array.from(possibleCellsSet).map((str) => {
        const [r, c] = str.split(",").map(Number);
        return [r, c] as [number, number];
      });
    }

    // Выбор случайной пустой соседней клетки (если есть), либо случайную из всех пустых
    const [r, c] =
      possibleCells.length > 0
        ? possibleCells[Math.floor(Math.random() * possibleCells.length)]
        : empty[Math.floor(Math.random() * empty.length)];

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = "X";
    return newBoard;
  };

  // Ход компьютера первым при старте или сбросе игры
  useEffect(() => {
    const isEmpty = board.flat().every((cell) => cell === null);
    if (isEmpty && !gameOver) {
      const newBoard = computerMove(board);
      const { winner: win, line } = checkWinner(newBoard);
      setBoard(newBoard);
      if (win) {
        setGameOver(true);
        setWinningLine(line);
      }
    }
  }, [gameOver]);

  // Ход игрока
  const handleCellClick = (r: number, c: number): void => {
    if (board[r][c] || gameOver) return;

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = "O";

    let { winner: win, line } = checkWinner(newBoard);
    if (win) {
      setBoard(newBoard);
      setGameOver(true);
      setWinningLine(line);
      return;
    }

    // Ход компьютера после игрока
    const afterComp = computerMove(newBoard);
    ({ winner: win, line } = checkWinner(afterComp));
    setBoard(afterComp);
    if (win) {
      setGameOver(true);
      setWinningLine(line);
    } else if (getEmptyCells(afterComp).length === 0) {
      setGameOver(true);
      setWinningLine(null);
    }
  };

  // Новая игра
  const resetGame = (): void => {
    setBoard(emptyBoard);
    setGameOver(false);
    setWinningLine(null);
    setLineLength(0);
  };

  // Появление линии выигрыша
  useEffect(() => {
    if (winningLine) {
      setLineLength(0);
      const totalLength = Math.hypot(
        winningLine.end.x - winningLine.start.x,
        winningLine.end.y - winningLine.start.y
      );
      let start: number | null = null;

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;

        const progress = Math.min(elapsed / 500, 1);
        setLineLength(totalLength * progress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    } else {
      setLineLength(0);
    }
  }, [winningLine]);

  // Автоматический сброс игры через 2 секунды после победы/ничьей
  useEffect(() => {
    if (gameOver) {
      const timer = setTimeout(() => {
        resetGame();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameOver]);

  return (
    <div style={{ width: 500, margin: "10px auto", textAlign: "center" }}>
      <h2>Крестики-нолики</h2>
      <div
        style={{
          position: "relative",
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          margin: "0 auto",
        }}
      >
        <Lottie
          animationData={gridImage}
          loop={false}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            zIndex: 2,
          }}
        >
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const cell = board[r][c];
              const left = c * CELL_SIZE;
              const top = r * CELL_SIZE;
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    cursor: cell || gameOver ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "auto",
                  }}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell === "O" && (
                    <Lottie
                      animationData={ovalImage}
                      loop={false}
                      style={{
                        width: ICON_SIZE,
                        height: ICON_SIZE,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {cell === "X" && (
                    <Lottie
                      animationData={crossImage}
                      loop={false}
                      style={{
                        width: ICON_SIZE,
                        height: ICON_SIZE,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
        {winningLine && (
          <svg
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            <line
              x1={winningLine.start.x}
              y1={winningLine.start.y}
              x2={winningLine.end.x}
              y2={winningLine.end.y}
              stroke="red"
              strokeWidth={6}
              strokeLinecap="round"
              style={{
                strokeDasharray: Math.hypot(
                  winningLine.end.x - winningLine.start.x,
                  winningLine.end.y - winningLine.start.y
                ),
                strokeDashoffset:
                  Math.hypot(
                    winningLine.end.x - winningLine.start.x,
                    winningLine.end.y - winningLine.start.y
                  ) - lineLength,
                transition: "stroke-dashoffset 0.1s linear",
              }}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
