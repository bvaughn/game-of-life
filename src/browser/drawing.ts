import { CANVAS_PADDING, CELL_GAP, COLORS, MAX_CELL_SIZE } from "../config";
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
}): number {
  cellSize = Math.min(
    MAX_CELL_SIZE,
    Math.floor((maxWidth - CANVAS_PADDING * 4) / numColumns),
    Math.floor((maxHeight - CANVAS_PADDING * 4) / numRows),
  );
  cellRadius = cellSize / 2 - CELL_GAP * 2;

  canvasHeight = numRows * cellSize + CANVAS_PADDING * 2;
  canvasWidth = numColumns * cellSize + CANVAS_PADDING * 2;

  const scale = devicePixelRatio;

  canvas.style.height = `${canvasHeight}px`;
  canvas.style.width = `${canvasWidth}px`;
  canvas.height = canvasHeight * scale;
  canvas.width = canvasWidth * scale;

  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.scale(scale, scale);

  return cellSize;
}

export function findIndices(game: Game, offsetX: number, offsetY: number) {
  const columnIndex = Math.floor((offsetX - CANVAS_PADDING) / cellSize);
  const rowIndex = Math.floor((offsetY - CANVAS_PADDING) / cellSize);

  if (
    columnIndex < 0 ||
    columnIndex >= game.numColumns ||
    rowIndex < 0 ||
    rowIndex >= game.numRows
  ) {
    return {
      columnIndex: null,
      rowIndex: null,
    };
  }

  return {
    columnIndex,
    rowIndex,
  };
}

export function renderCell({
  columnIndex,
  context,
  isAlive,
  rowIndex,
  wasAlive,
}: {
  columnIndex: number;
  context: CanvasRenderingContext2D;
  isAlive: boolean;
  rowIndex: number;
  wasAlive: boolean;
}) {
  const x = CANVAS_PADDING + columnIndex * cellSize + CELL_GAP;
  const y = CANVAS_PADDING + rowIndex * cellSize + CELL_GAP;

  // Reset/clear the cell before rendering (in case it has changed);
  context.fillStyle = COLORS.BLACK;
  context.beginPath();
  context.arc(x + cellRadius, y + cellRadius, cellRadius, 0, 2 * Math.PI);
  context.fill();

  if (isAlive) {
    if (wasAlive) {
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

    const wasAlive = prevLiveCells.includes(index);
    const isAlive = liveCells.includes(index);

    renderCell({
      columnIndex,
      context,
      isAlive,
      rowIndex,
      wasAlive,
    });
  }
}
