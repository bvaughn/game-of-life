import { assert } from "../assert";
import { MAX_INITIAL_LOOPS } from "../config";
import { Game, createGame } from "../game";
import { print } from "./drawing";

const FPS = 20;

const numColumns = parseInt(process.argv[2] ?? "20");
const numRows = parseInt(process.argv[3] ?? "10");
const liveCellDensity = parseInt(process.argv[4] ?? "25") / 100;

let game: Game;
let loopIndex = -1;

export async function initialize() {
  game = createGame({
    liveCellDensity,
    numColumns,
    numRows,
  });

  await game.analyzeSync(MAX_INITIAL_LOOPS);
}

export function run() {
  loopIndex++;

  if (loopIndex === game.states.length - 1) {
    loopIndex = 0;
  }

  const gameState = game.states[loopIndex];
  const prevGameState = game.states[loopIndex - 1];

  assert(gameState);

  print(game, gameState, prevGameState, loopIndex);

  setTimeout(() => {
    run();
  }, 1000 / FPS);
}
