import { assert } from "../assert";
import { Game, State } from "../game";

const FORMAT = {
  gray: (text: string) => "\x1b[90m" + text + "\x1b[0m",
  green: (text: string) => "\x1b[32m" + text + "\x1b[0m",
  yellow: (text: string) => "\x1b[33m" + text + "\x1b[0m",
};

export function print(
  game: Game,
  gameState: State,
  prevGameState: State | undefined,
  loopIndex: number,
) {
  const { numColumns, numRows } = game;
  const { dyingCellCount, liveCells, livingCellCount } = gameState;
  const { liveCells: prevLiveCells = [] } = prevGameState ?? {};

  let string = "";

  const length = numColumns * numRows;
  for (let index = 0; index < length; index++) {
    if (index > 0 && index % numColumns === 0) {
      string += "\n";
    }

    const wasAlive = prevLiveCells.includes(index);
    const isAlive = liveCells.includes(index);
    if (isAlive) {
      string += FORMAT.green(wasAlive ? "◍" : "◌");
    } else if (wasAlive) {
      string += FORMAT.gray("◌");
    } else {
      string += " ";
    }
  }

  const loopLabel = `${FORMAT.yellow(`${loopIndex + 1}`)} ${FORMAT.gray(
    `of ${game.states.length}`,
  )}`;

  console.clear();
  console.log(drawBoxAround(string));
  console.log(
    spaceBetween(
      numColumns + 2, // Padding for box sides
      loopLabel,
      `${FORMAT.green("◍")} ${livingCellCount}`,
      `${FORMAT.gray("◌")} ${dyingCellCount}`,
    ),
  );

  // Useful for debugging
  // console.log(state);
}

function drawBoxAround(text: string) {
  const lines = text.split("\n");
  const numColumns = lines.reduce((longestLine, line) => {
    return Math.max(longestLine, removeFormatting(line).length);
  }, 0);

  text = "";
  text += FORMAT.gray("┌" + "─".repeat(numColumns) + "┐");
  text += "\n";
  text += lines
    .map((line) => {
      return (
        FORMAT.gray("│") +
        line +
        " ".repeat(numColumns - removeFormatting(line).length) +
        FORMAT.gray("│")
      );
    })
    .join("\n");
  text += "\n";
  text += FORMAT.gray("└" + "─".repeat(numColumns) + "┘");

  return text;
}

function removeFormatting(text: string) {
  return text.replace(/(\x1b\[[0-9]+m)/g, "");
}

function spaceBetween(numCharacters: number, ...texts: string[]) {
  if (texts.length <= 1) {
    return texts.join("");
  }

  const lastText = texts[texts.length - 1];
  assert(lastText);
  const availableSpace = numCharacters - removeFormatting(lastText).length;
  const columnWidth = availableSpace / Math.floor(texts.length - 1);

  return texts
    .map((text) => {
      const textLength = removeFormatting(text).length;
      const numTrailingSpaces = Math.max(1, columnWidth - textLength);

      return text + " ".repeat(numTrailingSpaces);
    })
    .join("");
}
