import { COLORS, MAX_CELL_SIZE, PADDING } from "../config";
import { Game, State } from "../game";

let canvasHeight: number = 0;
let canvasWidth: number = 0;
let cellRadius: number = 0;
let cellSize: number = 0;

export function initialCanvas({
  canvas,
  devicePixelRatio,
  maxHeight,
  maxWidth,
  numColumns,
  numRows,
}: {
  canvas: HTMLCanvasElement;
  devicePixelRatio: number;
  maxHeight: number;
  maxWidth: number;
  numColumns: number;
  numRows: number;
}) {
  cellSize = Math.min(
    MAX_CELL_SIZE,
    Math.floor((maxWidth - PADDING * 4) / numColumns),
    Math.floor((maxHeight - PADDING * 4) / numRows),
  );
  cellRadius = cellSize / 2;

  canvasHeight = numRows * cellSize + PADDING * 2;
  canvasWidth = numColumns * cellSize + PADDING * 2;

  const scale = devicePixelRatio;

  canvas.style.height = `${canvasHeight}px`;
  canvas.style.width = `${canvasWidth}px`;
  canvas.height = canvasHeight * scale;
  canvas.width = canvasWidth * scale;

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.scale(scale, scale);
}

export function renderState({
  canvas,
  game,
  gameState,
  prevGameState,
}: {
  canvas: HTMLCanvasElement;
  game: Game;
  gameState: State;
  prevGameState: State | null;
}) {
  const { numColumns, numRows } = game;
  const { liveCells } = gameState;

  const prevLiveCells: number[] = prevGameState ? prevGameState.liveCells : [];

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.strokeStyle = COLORS.DARK_GRAY;
  context.beginPath();
  context.roundRect(0, 0, canvasWidth, canvasHeight, cellRadius);
  context.stroke();

  const length = numColumns * numRows;
  for (let index = 0; index < length; index++) {
    const rowIndex = Math.floor(index / numColumns);
    const columnIndex = index % numColumns;

    const x = PADDING + columnIndex * cellSize;
    const y = PADDING + rowIndex * cellSize;

    const wasAlive = prevLiveCells.includes(index);
    const isAlive = liveCells.includes(index);
    if (isAlive) {
      if (wasAlive || prevGameState == null) {
        context.fillStyle = COLORS.GREEN;
        context.strokeStyle = COLORS.BLACK;
        context.setLineDash([]);
        context.beginPath();
        context.arc(x + cellRadius, y + cellRadius, cellRadius, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
      } else {
        context.fillStyle = COLORS.BLACK;
        context.strokeStyle = COLORS.GREEN;
        context.setLineDash([2, 1]);
        context.beginPath();
        context.arc(x + cellRadius, y + cellRadius, cellRadius, 0, 2 * Math.PI);
        context.stroke();
      }
    } else if (wasAlive) {
      context.fillStyle = COLORS.ALMOST_BLACK;
      context.strokeStyle = COLORS.BLACK;
      context.setLineDash([]);
      context.beginPath();
      context.arc(x + cellRadius, y + cellRadius, cellRadius, 0, 2 * Math.PI);
      context.fill();
      context.stroke();
    }
  }
}
