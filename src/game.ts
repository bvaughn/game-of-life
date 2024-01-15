import { assert } from "./assert";

export interface State {
  deadCellCount: number;
  dyingCellCount: number;
  liveCells: number[];
  livingCellCount: number;
}

export interface Game {
  analyze(maxStates: Number): Promise<void>;
  analyzeSync(maxStates: Number): void;
  cellMovement: number;
  getState(index: number): State;
  numColumns: number;
  numRows: number;
  states: State[];
}

export function createGame({
  cellMovement = 0,
  liveCellDensity,
  numColumns,
  numRows,
}: {
  cellMovement?: number;
  liveCellDensity: number;
  numColumns: number;
  numRows: number;
}): Game {
  const totalCellCount = numColumns * numRows;

  const liveCells = new Array(totalCellCount)
    .fill(0)
    .reduce((liveCells, cell, index) => {
      if (Math.random() < liveCellDensity) {
        liveCells.push(index);
      }
      return liveCells;
    }, []);

  const initialState: State = {
    deadCellCount: totalCellCount - liveCells.length,
    dyingCellCount: 0,
    liveCells,
    livingCellCount: liveCells.length,
  };

  const states: State[] = [initialState];

  const game: Game = {
    analyze: async (maxStates: number, maxTickMs: number = 10) => {
      let currentState = initialState;

      const serializedStates = new Set();

      return new Promise((resolve) => {
        function tick() {
          let start = performance.now();

          currentState = computeNextState(game, currentState);

          states.push(currentState);

          const serialized = currentState.liveCells.join(",");
          if (serializedStates.has(serialized)) {
            resolve();

            return;
          } else if (states.length === maxStates) {
            resolve();

            return;
          }

          serializedStates.add(serialized);

          if (performance.now() - start < maxTickMs) {
            tick();
          } else {
            setTimeout(tick, 10);
          }
        }

        tick();
      });
    },
    analyzeSync: (maxStates: number) => {
      let currentState = initialState;

      const serializedStates = new Set();

      while (true) {
        currentState = computeNextState(game, currentState);

        states.push(currentState);

        const serialized = currentState.liveCells.join(",");
        if (serializedStates.has(serialized)) {
          return;
        } else if (states.length === maxStates) {
          return;
        }

        serializedStates.add(serialized);
      }
    },
    cellMovement,
    getState: (index) => {
      const state = states[index];
      assert(state !== undefined);
      return state;
    },
    numColumns,
    numRows,
    states,
  };

  return game;
}

function computeNextState(game: Game, prevState: State): State {
  const { cellMovement, numColumns, numRows } = game;
  const { liveCells: prevLiveCells } = prevState;

  const totalCellCount = numColumns * numRows;

  let nextLiveCells: number[] = [];

  let dyingCellCount = 0;
  let livingCellCount = 0;

  const length = numColumns * numRows;
  for (let index = 0; index < length; index++) {
    const isAlive = prevLiveCells.includes(index);

    const numLiveNeighbors = getLiveNeighborCount(game, prevState, index);

    if (isAlive) {
      switch (numLiveNeighbors) {
        case 0:
        case 1: {
          // Underpopulation
          dyingCellCount++;
          break;
        }
        case 2:
        case 3: {
          // Survival
          nextLiveCells.push(index);
          livingCellCount++;
          break;
        }
        default: {
          // Overpopulation
          dyingCellCount++;
          break;
        }
      }
    } else {
      switch (numLiveNeighbors) {
        case 3: {
          // Reproduction
          nextLiveCells.push(index);
          livingCellCount++;
          break;
        }
      }
    }
  }

  if (cellMovement > 0) {
    console.group("move");
    nextLiveCells = nextLiveCells.map((index) => {
      const rowIndex = Math.floor(index / numColumns);
      const columnIndex = index % numColumns;

      if (Math.random() < cellMovement) {
        // Cells can move in any direction within the board in "normal" space
        // aka no PacMan style movements.

        const newIndices: number[] = [];
        if (rowIndex > 0) {
          // Move up
          newIndices.push(index - numColumns);
        }
        if (rowIndex < numRows - 1) {
          // Move down
          newIndices.push(index + numColumns);
        }
        if (columnIndex > 0) {
          // Move left
          newIndices.push(index - 1);
        }
        if (columnIndex < numColumns - 1) {
          // Move right
          newIndices.push(index + 1);
        }

        const randomIndex = Math.floor(Math.random() * newIndices.length);
        const newIndex = newIndices[randomIndex];

        return newIndex ?? index;
      }

      return index;
    });
    console.groupEnd();
  }

  const nextState: State = {
    ...prevState,
    deadCellCount: totalCellCount - livingCellCount - dyingCellCount,
    dyingCellCount,
    livingCellCount,
    liveCells: nextLiveCells,
  };

  return nextState;
}

function getLiveNeighborCount(game: Game, state: State, index: number): number {
  const { numColumns, numRows } = game;
  const { liveCells } = state;

  let liveNeighborCount = 0;

  const rowIndex = Math.floor(index / numColumns);
  const columnIndex = index % numColumns;

  const maxColumnIndex = numColumns - 1;
  const maxRowIndex = numRows - 1;

  const indices: number[] = [];

  if (rowIndex > 0) {
    // Above
    indices.push(index - numColumns);
  }

  if (rowIndex < maxRowIndex) {
    // Below
    indices.push(index + numColumns);
  }

  if (columnIndex > 0) {
    if (rowIndex > 0) {
      // Diagonal above and left
      indices.push(index - numColumns - 1);
    }
    // Left
    indices.push(index - 1);
    if (rowIndex < maxRowIndex) {
      // Diagonal below and left
      indices.push(index + numColumns - 1);
    }
  }

  if (columnIndex < maxColumnIndex) {
    if (rowIndex > 0) {
      // Diagonal above and right
      indices.push(index - numColumns + 1);
    }
    // Right
    indices.push(index + 1);
    if (rowIndex < maxRowIndex) {
      // Diagonal below and right
      indices.push(index + numColumns + 1);
    }
  }

  indices.forEach((index) => {
    const isAlive = liveCells.includes(index);
    if (isAlive) {
      liveNeighborCount++;
    }
  });

  return liveNeighborCount;
}
