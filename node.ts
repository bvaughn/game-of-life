import { initialize, run } from "./src/node/interface";

(async () => {
  await initialize();

  run();
})();
