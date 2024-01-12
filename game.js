function compute(prevState) {
  const {liveCells: prevLiveCells, numColumns, numRows} = prevState;

  let nextLiveCells = [];

  const nextState = {
    ...prevState,
    liveCells: nextLiveCells,
  };

  const length = numColumns * numRows;
  for (let index = 0; index < length; index++) {
    const isAlive = prevLiveCells.includes(index);

    const numLiveNeighbors = getLiveNeighborCount(prevState, index);

    if (isAlive) {
      switch (numLiveNeighbors) {
        case 0:
        case 1: {
          // Underpopulation
          break;
        }
        case 2:
        case 3: {
          // Survival
          nextLiveCells.push(index);
          break;
        }
        default: {
          // Overpopulation
          break;
        }
      }
    } else {
      switch (numLiveNeighbors) {
        case 3: {
          // Reproduction
          nextLiveCells.push(index);
          break;
        }
      }
    }
  }

  return nextState;
}

function getLiveNeighborCount(state, index) {
  const { liveCells, numColumns, numRows } = state;

  let liveNeighborCount = 0;

  const length = numColumns * numRows;

  ([
    // Diagonal above and left
    index - numColumns - 1,
    // Above
    index - numColumns,
    // Diagonal above and right
    index - numColumns + 1,
    // Left
    index - 1,
    // Right
    index + 1,
    // Diagonal below and left
    index + numColumns - 1,
    // Below
    index + numColumns,
    // Diagonal below and right
    index + numColumns + 1,
  ]).forEach(index => {
    if (index >= 0 && index < length) {
      const isAlive = liveCells.includes(index);
      if (isAlive) {
        liveNeighborCount++;
      }
    }
  })

  return liveNeighborCount;
}

function print(header, state) {
  const {liveCells, numColumns, numRows} = state;

  let string = "";

  const length = numColumns * numRows;
  for (let index = 0; index < length; index++) {
    if (index > 0 && index % numColumns === 0) {
      string += "\n";
    }

    const isAlive = liveCells.includes(index);

    string += isAlive ? "█" : "░";
  }

  console.log(`${header}\n${string}\n`);
}

const initialState = [
  0,1,1,0,0,0,0,0,0,
  0,0,0,1,0,0,0,0,0,
  0,0,0,0,1,0,0,0,0,
  0,0,0,1,0,0,0,0,0,
  0,0,1,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,1,0,0,0,
  0,0,0,0,1,1,1,1,0,
  0,0,0,1,1,1,0,0,0,
  0,0,0,0,1,0,1,0,0,
  0,0,0,0,0,1,0,0,0,
  0,0,0,0,0,1,0,0,0,
];

let state = {
  liveCells: initialState.reduce((liveCells, cell, index) => {
    if (cell === 1) {
      liveCells.push(index);
    }
    return liveCells;
  }, []),
  numColumns: 9,
  numRows: 12,
};
console.log(state)

print(`Initial state`, state);

let index = 0;

async function loop() {
  index++;

  prevState = {...state};

  state = compute(state);

  if (JSON.stringify(prevState) === JSON.stringify(state)) {
    clearInterval(interval);
    return;
  }

  print(`Iteration ${index + 1}`, state);
}

const interval = setInterval(loop, 250);
