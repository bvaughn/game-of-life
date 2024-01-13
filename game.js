const FPS = 24;

const FORMAT = {
  gray: text => '\x1b[90m' + text + '\x1b[0m',
  green: text => '\x1b[32m' + text + '\x1b[0m',
  yellow: text => '\x1b[33m' + text + '\x1b[0m',
}

function drawBoxAround(string) {
  const lines = string.split('\n');
  const numColumns = lines.reduce((longestLine, line) => {
    return Math.max(longestLine, removeFormatting(line).length)
  }, 0)

  string = '';
  string += FORMAT.gray('┌' + '─'.repeat(numColumns) + '┐');
  string += '\n';
  string += lines.map(line => {
    return FORMAT.gray('│') + line + ' '.repeat(numColumns - removeFormatting(line).length) + FORMAT.gray('│')
  }).join('\n');
  string += '\n';
  string += FORMAT.gray('└' + '─'.repeat(numColumns) + '┘');

  return string;;
}

function removeFormatting(text) {
  return text.replace(/(\x1b\[[0-9]+m)/g, '');
}

function justify(leftText, rightText, numColumns) {
  const leftChars = removeFormatting(leftText).length;
  const rightChars = removeFormatting(rightText).length;

  const spaces = Math.max(1, numColumns - (leftChars + rightChars));

  return leftText + ' '.repeat(spaces) + rightText;
}

const CELLS = {
  DEAD: ' ',
  DYING: FORMAT.gray('◌'),
  LIVE: FORMAT.green('◍'),
};

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

  const rowIndex = Math.floor(index / numColumns);
  const columnIndex = index % numColumns;

  const maxColumnIndex = numColumns - 1;
  const maxRowIndex = numRows - 1;

  const length = numColumns * numRows;

  const indices = [
    // Above
    index - numColumns,
    // Below
    index + numColumns,
  ];

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

  indices.forEach(index => {
    const isAlive = liveCells.includes(index);
    if (isAlive) {
      liveNeighborCount++;
    }
  })

  return liveNeighborCount;
}

function print(state, prevState = {}) {
  const {liveCells, numColumns, numRows} = state;
  const {liveCells: prevLiveCells = []} = prevState;

  let string = '';

  let totalDyingCells = 0;
  let totalLiveCells = 0;

  const length = numColumns * numRows;
  for (let index = 0; index < length; index++) {
    if (index > 0 && index % numColumns === 0) {
      string += "\n";
    }

    const wasAlive = prevLiveCells.includes(index);
    const isAlive = liveCells.includes(index);
    if (isAlive) {
      totalLiveCells++;
    } else if (wasAlive) {
      totalDyingCells++;
    }

    string += isAlive
      ? CELLS.LIVE
      : wasAlive
        ? CELLS.DYING
        : CELLS.DEAD;
  }

  string = drawBoxAround(string);

  string += '\n ' + justify(FORMAT.yellow(loopIndex + 1), `${CELLS.LIVE} ${totalLiveCells} ${CELLS.DYING} ${totalDyingCells}`, numColumns);

  console.clear();
  console.log(string);

  // Useful for debugging
  // console.log(state);
}

const initialState = [
  0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,
  0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,
];

const initialLiveCells = initialState.reduce((liveCells, cell, index) => {
  if (cell === 1) {
    liveCells.push(index);
  }
  return liveCells;
}, []);

let state = {
  liveCells: initialLiveCells,
  numColumns: 24,
  numRows: 12,
};

let loopIndex = 0;

print(state);

async function loop() {
  loopIndex++;

  const prevState = {...state};

  state = compute(state);

  print(state, prevState);

  if (JSON.stringify(prevState) === JSON.stringify(state)) {
    loopIndex = 0;
    state = {
      ...state,
      liveCells: initialLiveCells,
    };
  }

}

const interval = setInterval(loop, 1000 / FPS);
