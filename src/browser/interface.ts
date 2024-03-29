import {
  CANVAS_PADDING,
  CELL_GAP,
  COLORS,
  MAX_CELL_COUNT,
  MAX_CELL_DENSITY,
  MAX_CELL_MOVEMENT,
  MAX_FRAMERATE,
  MAX_INITIAL_LOOPS,
} from "../config";
import { Game, createGame } from "../game";
import { initializeCanvas, renderState } from "./drawing";

const buttonElements = {
  next: document.getElementById("nextButton") as HTMLButtonElement,
  loopPlayback: document.getElementById(
    "loopPlaybackButton",
  ) as HTMLButtonElement,
  playPause: document.getElementById("playPauseButton") as HTMLButtonElement,
  previous: document.getElementById("previousButton") as HTMLButtonElement,
  restart: document.getElementById("restartButton") as HTMLButtonElement,
};

const inputElements = {
  cellMovement: document.getElementById(
    "cellMovementInput",
  ) as HTMLInputElement,
  density: document.getElementById("densityInput") as HTMLInputElement,
  framerate: document.getElementById("framerateInput") as HTMLInputElement,
  numCells: document.getElementById("numCellsInput") as HTMLInputElement,
};

const labelElements = {
  loopIndex: document.getElementById("loopIndex") as HTMLDivElement,
  maxLoopIndex: document.getElementById("maxLoopIndex") as HTMLDivElement,
  numDyingCells: document.getElementById("numDyingCells") as HTMLDivElement,
  numLiveCells: document.getElementById("numLiveCells") as HTMLDivElement,
};

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

{
  // Initialize CSS variables from config
  for (let key in COLORS) {
    const name = "--color-" + key.toLowerCase().replace(/_/g, "-");
    const value = COLORS[key as keyof typeof COLORS];

    document.body.style.setProperty(name, value);
  }
  document.body.style.setProperty("--canvas-padding", `${CANVAS_PADDING}px`);
  document.body.style.setProperty("--cell-gap", `${CELL_GAP}px`);
}

inputElements.cellMovement.max = "" + MAX_CELL_MOVEMENT;
inputElements.density.max = "" + MAX_CELL_DENSITY;
inputElements.numCells.max = "" + MAX_CELL_COUNT;
inputElements.framerate.max = "" + MAX_FRAMERATE;

// Game state
let framerate: number = 0;
let game: Game;
let gameStateIndex: number = 0;
let isPlaying: boolean = false;
let timeout: ReturnType<typeof setTimeout> | null = null;
let loopPlayback: boolean = true;

function restartOnEnter(event: KeyboardEvent) {
  switch (event.key) {
    case "Enter": {
      startNewGame();
      break;
    }
  }
}

function showNextState() {
  stopPlayback();

  if (gameStateIndex === game.states.length - 1) {
    gameStateIndex = 0;
  } else {
    gameStateIndex++;
  }

  updateInterface();
}

function showPreviousState() {
  stopPlayback();

  if (gameStateIndex === 0) {
    gameStateIndex = game.states.length - 1;
  } else {
    gameStateIndex--;
  }

  updateInterface();
}

async function startNewGame() {
  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }

  gameStateIndex = 0;
  isPlaying = false;

  const cellMovement = Math.max(
    0,
    Math.min(MAX_CELL_MOVEMENT, parseInt(inputElements.cellMovement.value)),
  );
  const liveCellDensity = Math.max(
    0,
    Math.min(100, parseInt(inputElements.density.value)),
  );
  const numCells = Math.max(
    1,
    Math.min(MAX_CELL_COUNT, parseInt(inputElements.numCells.value)),
  );

  framerate = Math.max(
    1,
    Math.min(30, parseInt(inputElements.framerate.value)),
  );

  inputElements.cellMovement.value = "" + cellMovement;
  inputElements.density.value = "" + liveCellDensity;
  inputElements.framerate.value = "" + framerate;
  inputElements.numCells.value = "" + numCells;

  const canvasContainer = canvas.parentElement as HTMLElement;

  const numColumns = Math.floor(Math.sqrt(numCells));
  const numRows = Math.floor(Math.sqrt(numCells));

  const cellSize = initializeCanvas({
    canvas,
    devicePixelRatio: window.devicePixelRatio,
    maxHeight: canvasContainer.clientHeight,
    maxWidth: canvasContainer.clientWidth,
    numColumns,
    numRows,
  });

  document.body.style.setProperty("--cell-size", `${cellSize}px`);

  canvasContainer.removeAttribute("data-ready");

  game = createGame({
    cellMovement: cellMovement / 100,
    liveCellDensity: liveCellDensity / 100,
    numColumns,
    numRows,
  });

  await game.analyze(MAX_INITIAL_LOOPS);

  canvasContainer.setAttribute("data-ready", "");

  updateInterface();
}

function stopPlayback() {
  if (timeout !== null) {
    clearTimeout(timeout);
  }

  isPlaying = false;
}

function toggleLoopPlayback() {
  loopPlayback = !loopPlayback;

  updateInterface();
}

function togglePlayPause() {
  if (isPlaying) {
    stopPlayback();
    updateInterface();
  } else {
    isPlaying = true;

    if (gameStateIndex === game.states.length - 1) {
      gameStateIndex = 0;
    }

    const tick = () => {
      if (gameStateIndex === game.states.length - 1) {
        if (loopPlayback) {
          gameStateIndex = 0;
        } else {
          isPlaying = false;
        }
      } else {
        gameStateIndex++;
      }

      updateInterface();

      if (isPlaying) {
        timeout = setTimeout(tick, 1000 / framerate);
      }
    };

    tick();
  }
}

function updateInterface() {
  const gameState = game.getState(gameStateIndex);
  const prevGameState =
    gameStateIndex > 0 ? game.getState(gameStateIndex - 1) : null;

  renderState({ canvas, game, gameState, prevGameState });

  labelElements.loopIndex.innerText = `${gameStateIndex + 1}`;
  labelElements.maxLoopIndex.innerText = `of ${game.states.length}`;
  labelElements.numDyingCells.textContent = `${gameState.dyingCellCount}`;
  labelElements.numLiveCells.textContent = `${gameState.livingCellCount}`;

  buttonElements.next.disabled = game.states.length === 1;
  buttonElements.playPause.disabled = game.states.length === 1;
  buttonElements.loopPlayback.setAttribute(
    "data-state",
    loopPlayback ? "active" : "inactive",
  );
  buttonElements.playPause.setAttribute(
    "data-state",
    isPlaying ? "active" : "inactive",
  );
  buttonElements.previous.disabled = game.states.length === 1;
}

for (let key in inputElements) {
  const element = inputElements[key as keyof typeof inputElements];
  element.addEventListener("keydown", restartOnEnter);
}

buttonElements.loopPlayback.addEventListener("click", toggleLoopPlayback);
buttonElements.next.addEventListener("click", showNextState);
buttonElements.previous.addEventListener("click", showPreviousState);
buttonElements.playPause.addEventListener("click", togglePlayPause);
buttonElements.restart.addEventListener("click", startNewGame);

startNewGame();
