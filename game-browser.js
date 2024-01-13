// Game configuration
const MAX_INITIAL_LOOPS = 500;
const MAX_CELL_SIZE = 15;
const PADDING = 10;

let timeout = null;

function initialize(numColumns, numRows, cellDensity, framerate) {
  if (timeout !== null) {
    clearTimeout(timeout);
  }

  const CELL_SIZE = Math.min(MAX_CELL_SIZE, Math.floor((window.innerWidth - PADDING * 4) / numColumns));
  const CELL_RADIUS = CELL_SIZE / 2;

  const height = numRows * CELL_SIZE + PADDING * 2;
  const width = numColumns * CELL_SIZE + PADDING * 2;

  let context;
  let loopIndexElement;
  let maxLoopIndexElement;
  let numDyingCellsElement;
  let numLiveCellsElement;

  {
    // Initialize canvas
    const scale = window.devicePixelRatio;
    const canvas = document.getElementById("canvas");
    canvas.style.height = `${height}px`;
    canvas.style.width = `${width}px`;
    canvas.height = height * scale;
    canvas.width = width * scale;

    context = document.getElementById("canvas").getContext("2d");
    context.scale(scale, scale);
  }

  {
    // Initialize DOM

    loopIndexElement = document.getElementById("loopIndex");
    maxLoopIndexElement = document.getElementById("maxLoopIndex");
    numDyingCellsElement = document.getElementById("numDyingCells");
    numLiveCellsElement = document.getElementById("numLiveCells");

    const dyingCellElement = document.getElementById("dyingCell");
    dyingCellElement.style.height = `${CELL_SIZE}px`;
    dyingCellElement.style.width = `${CELL_SIZE}px`;

    const liveCellElement = document.getElementById("liveCell");
    liveCellElement.style.height = `${CELL_SIZE}px`;
    liveCellElement.style.width = `${CELL_SIZE}px`;
  }

  const initialLiveCells = new Array(numColumns * numRows)
    .fill(0)
    .reduce((liveCells, cell, index) => {
      if (Math.random() < cellDensity) {
        liveCells.push(index);
      }
      return liveCells;
    }, []);

  let state = {
    liveCells: initialLiveCells,
    numColumns,
    numRows
  };

  let loopIndex = 0;
  let maxLoopIndex = 0;

  const serializedStates = new Set();

  // Find max cycles
  {
    let clonedState = { ...state };

    while (loopIndex < MAX_INITIAL_LOOPS) {
      const serialized = clonedState.liveCells.join(",");
      if (serializedStates.has(serialized)) {
        maxLoopIndex = loopIndex - 1;
        break;
      } else {
        serializedStates.add(serialized);
      }

      loopIndex++;
      clonedState = compute(clonedState);
    }
  }

  loopIndex = 0;

  function draw(state, prevState = {}) {
    const { liveCells, numColumns, numRows } = state;
    const { liveCells: prevLiveCells = [] } = prevState;
  
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "#ccc";
    context.beginPath();
    context.roundRect(0, 0, width, height, CELL_RADIUS);
    context.stroke();
  
    let totalDyingCells = 0;
    let totalLiveCells = 0;
  
    const length = numColumns * numRows;
    for (let index = 0; index < length; index++) {
      const rowIndex = Math.floor(index / numColumns);
      const columnIndex = index % numColumns;
  
      const x = PADDING + columnIndex * CELL_SIZE;
      const y = PADDING + rowIndex * CELL_SIZE;
  
      const wasAlive = prevLiveCells.includes(index);
      const isAlive = liveCells.includes(index);
      if (isAlive) {
        context.fillStyle = "green";
        context.strokeStyle = "black";
        context.beginPath();
        context.arc(
          x + CELL_RADIUS,
          y + CELL_RADIUS,
          CELL_RADIUS,
          0,
          2 * Math.PI
        );
        context.fill();
        context.stroke();
  
        totalLiveCells++;
      } else if (wasAlive) {
        context.fillStyle = "none";
        context.strokeStyle = "grey";
        context.setLineDash([2, 1]);
        context.beginPath();
        context.arc(
          x + CELL_RADIUS,
          y + CELL_RADIUS,
          CELL_RADIUS,
          0,
          2 * Math.PI
        );
        context.stroke();
  
        totalDyingCells++;
      }
    }

    loopIndexElement.innerText = loopIndex + 1;
    maxLoopIndexElement.innerText =
      maxLoopIndex !== 0 ? ` of ${maxLoopIndex}` : "";
    numDyingCellsElement.textContent = totalDyingCells;
    numLiveCellsElement.textContent = totalLiveCells;
  
    // Useful for debugging
    // console.log(state);
  }

  async function next(delay) {
    loopIndex++;

    if (maxLoopIndex != null && loopIndex === maxLoopIndex) {
      loopIndex = 0;
      state = {
        ...state,
        liveCells: initialLiveCells
      };
    }

    const prevState = { ...state };

    state = compute(state);

    draw(state, prevState);

    timeout = setTimeout(() => {
      next(delay);
    }, delay);
  }

  next(1000 / framerate);
}

function compute(prevState) {
  const { liveCells: prevLiveCells, numColumns, numRows } = prevState;

  let nextLiveCells = [];

  const nextState = {
    ...prevState,
    liveCells: nextLiveCells
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

  const indices = [];

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

  indices.forEach(index => {
    const isAlive = liveCells.includes(index);
    if (isAlive) {
      liveNeighborCount++;
    }
  });

  return liveNeighborCount;
}